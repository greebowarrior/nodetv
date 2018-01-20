"use strict"

const mongoose = require('mongoose')
const helpers = require('nodetv-helpers')

const episodeSchema = new mongoose.Schema({
	ids: {
		imdb: String,
		tmdb: Number,
		trakt: Number,
		tvdb: Number
	},
	episode: {type: Number, required: true},
	season: {type: Number, required: true},
	title: {type: String, required: true},
	overview: String,
	first_aired: Date,
	updated_at: {type: Date, default: null},
	watchers: [{
		_id: false,
		rating: Number,
		watcher: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		watches: [{
			_id: false,
			id: mongoose.Schema.Types.Long,
			date: {type: Date, default: new Date()}
		}]
	}],
	hashes: [{
		_id: false,
		added: {type: Date, default: new Date()},
		btih: {type: String, uppercase: true, required: true},
		hash: String,
		hd: {type: Boolean, default: false},
		linked: [Number],
		multi: {type: Boolean, default: false},
		quality: {type: String, enum: ['SD','720p','1080p']},
		repack: {type: Boolean, default: false},
		proper: {type: Boolean, default: false}
	}],
	file: {
		added: Date,
		download: {
			active: {type: Boolean},
			btih: {type: String, uppercase: true},
			hashString: {type: String}
		},
		filename: String,
		filesize: Number,
		quality: {type: String, enum: ['SD','720p','1080p']}
	}
},{
	toObject:{virtuals:true}, toJSON:{virtuals:true}
})

episodeSchema.methods.setInfoHash = function(data){
	// Add an info hash to the episode document
	return new Promise((resolve,reject)=>{
		if (!data.btih) return reject({error:`No Info Hash`})
		if (this.hashes.findIndex(item=>{return item.btih == data.btih}) == -1) this.hashes.push(data)
		resolve(this)
	})
}
episodeSchema.methods.getInfoHash = function(){
	let config = this.parent().config
	
	return new Promise(resolve=>{
		// Sort array by quality
		this.hashes.sort((a,b)=>{
			if (a.quality == b.quality){
				if (a.repack && !b.repack) return -1
				if (!a.repack && b.repack) return 1
				return 0
			}
			if (a.quality == '1080p' && b.quality != '1080p') return -1
			if (a.quality == '720p'){
				if (b.quality == '1080p') return 1
				if (b.quality == 'SD') return -1
			}
			if (a.quality == 'SD') return 1
			return 0
		})
		let filtered = this.hashes.filter(hash=>{
			return hash.quality == config.quality
		})
		if (filtered.length) resolve(filtered[0])
		
	})
}

episodeSchema.methods.setCollected = function(file=false,date=null){
	if (!date) date = new Date()
	
	return this.parent().getSubscribers()
		.then(subscribers=>{
			subscribers.forEach(user=>{
				helpers.trakt(user).sync.collection.add({
					episodes:[{
						ids:{trakt:this.ids.trakt},
						collected_at:date.toISOString(),
						media_type: 'digital'
					}]
				})
			})
			return null
		})
		.finally(()=>{
			if (file){
				this.file.filename = file
				this.file.added = date
				this.file.download.active = undefined
			}
			return this
		})
}
episodeSchema.methods.setWatched = function(user, date=null, id=null){
	if (!date) date = new Date()
	
	return new Promise(resolve=>{
		let idx = this.watchers.findIndex(item=>{
			return item.watcher.equals(user._id)
		})
		if (idx >= 0){
			let checkin = this.watchers[idx].watches.findIndex(item=>{
				return item.id == id || item.date == new Date(date)
			})
			if (checkin >= 0){
				if (id) this.watchers[idx].watches[checkin].id = id
			} else {
				this.watchers[idx].watches.push({date:date,id:id})
			}
			resolve(id)
		} else {
			this.watchers.push({
				watcher: user._id,
				watches: [{date:date,id:id}]
			})
			resolve(id)
		}
	})
	.then(id=>{
		if (!id){
			helpers.trakt(user).sync.history.add({
				episodes: [{ids:{trakt:this.ids.trakt},watched_at:date}]
			})
		}
		return this
	})
}
episodeSchema.methods.setUnwatched = function(user){
	return new Promise(resolve=>{
		let idx = (this.watchers || []).findIndex(item=>item.watcher.equals(user._id))
		if (idx >= 0){
			helpers.trakt(user).sync.history.remove({episodes:[{ids:{trakt:this.ids.trakt}}]})
			this.watchers[idx] = undefined
		}
		resolve()
	})
}

episodeSchema.methods.getFilename = function(file){
	let config = this.parent().config
	
	let vars = {
		S: require('zero-fill')(2, this.season),
		E: require('zero-fill')(2, this.episode),
		T: '',
		X: require('path').extname(file).replace(/^\./,'') || 'mkv'
	}
	
	// TODO: Use the filename E01-02, etc to get the multi-episode filename
	
	if (this.hashes.linked && this.hashes.linked.length > 1){
		/*
		// Multi-episode file - get all parts to generate the filename/title
		let linked = this.parent().episodes.filter(item=>{
			return this.season == item.season && this.hashes.linked.indexOf(item.episode) >= 0
		})
		linked.sort((a,b)=>{
			if (a.episode < b.episode) return 1
			if (a.episode > b.episode) return -1
			return 0
		})
		
		let titles = []
		linked.forEach(episode=>titles.push(episode.title))
		vars.T = titles.join('; ')
		
		vars.E = [
			require('zero-fill')(2,linked[0].episode),
			require('zero-fill')(2,linked[linked.length-1].episode)
		].join('-')
		*/
	} else {
		vars.T = helpers.utils.normalize(this.title)
	}
	
	let filename = config.format.replace(/%(\w)/g, (match, key)=>{
		return vars[key.toUpperCase()] ? vars[key.toUpperCase()] : key
	})
	return filename
}
episodeSchema.methods.getMagnet = function(){
	return this.getInfoHash().then(hash=>{
		return helpers.torrents.createMagnet(hash.btih)
	})
}

episodeSchema.methods.setDownloading = function(hash){
	return new Promise(resolve=>{
		this.file.download.active = true
		this.file.download.hashString = hash.toUpperCase()
		resolve()
	})
}

episodeSchema.methods.play = function(user,url){
	
	return helpers.upnp.setDevice(url).then(device=>{
		let media = {
			title: `${this.parent().title} - S${this.season}E${this.episode}: ${this.title}`,
			url: this.file.url
		}
		return device.load(media)
		
	}).then(device=>{
		let media = {duration:0,position:0}
		
		device.on('playing', ()=>{
			device.getDuration((error,duration)=>{
				media.duration=duration
			})
			device.getPosition((error,position)=>{
				media.position = position
				/*
				helpers.trakt(user).scrobble.start({
					episode:{ids:{trakt:this.ids.trakt}},
					progress: position/media.duration
				})
				*/
				console.debug('[UPNP] playing', media.duration, position)
			})
		})
		device.on('paused', ()=>{
			device.getPosition((error,position)=>{
				media.position = position
				/*
				helpers.trakt(user).scrobble.pause({
					episode:{ids:{trakt:this.ids.trakt}},
					progress: position/media.duration
				})
				*/
				console.debug('[UPNP] paused', media.duration, position)
			})
		})
		device.on('stopped', ()=>{
			device.getPosition((error,position)=>{
				media.position = position
				/*
				helpers.trakt(user).scrobble.stop({
					episode:{ids:{trakt:this.ids.trakt}},
					progress: position/media.duration
				})
				*/
				console.debug('[UPNP] stopped', media.duration, position)
			})
		})
		
		device.on('status', (status)=>{
			console.debug('[UPNP] ', status)
		})
	})
	
}

episodeSchema.virtual('uri').get(function(){
	return `${this.parent().uri}/seasons/${this.season}/episodes/${this.episode}`
})
episodeSchema.virtual('file.url').get(function(){
	if (this.parent().config.directory && this.file.filename){
		return process.env.WEB_URL +'media/'+ process.env.MEDIA_SHOWS + this.parent().config.directory +'/'+ this.file.filename
	}
})

module.exports = episodeSchema