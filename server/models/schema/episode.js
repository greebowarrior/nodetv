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
			id: String,
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
		quality: {type: String, enum: ['SD','720p','1080p']},
		repack: {type: Boolean, default: false}
	}],
	file: {
		added: Date,
		download: {
			active: Boolean,
			hashString: String
		},
		filename: String,
		filesize: Number,
		quality: {type: String, enum: ['SD','720p','1080p']}
	}
})

episodeSchema.methods.setInfoHash = function(data){
	// Add an info hash to the episode document
	return new Promise((resolve,reject)=>{
		if (!data.btih) return reject({error:`No Info Hash`})
		if (this.hashes.findIndex(item=>{return item.btih == data.btih}) == -1) this.hashes.push(data)
		resolve(this)
	})
}

episodeSchema.methods.setCollected = function(file=false){
	return this.parent().getSubscribers()
		.then(subscribers=>{
			subscribers.forEach(user=>{
				helpers.trakt(user).sync.collection.add({episodes:[{ids:{trakt:this.ids.trakt}}]})
			})
		})
		.finally(()=>{
			if (file) this.file.filename = file
			this.file.added = new Date()
			this.file.download.active = undefined
			
			return this
		})
}
episodeSchema.methods.setWatched = function(user, date=null){
	if (!date) date = new Date()
	
	return new Promise(resolve=>{
		let idx = (this.watchers || []).findIndex(item=>item.watcher.equals(user._id))
		
		if (idx >= 0){
			let check = this.watchers[idx].watches.findIndex(item=>{
				return item.date == date
			})
			if (check == -1){
				this.watchers[idx].watches.push({date:date})
				helpers.trakt(user).sync.history.add({
					episodes: [{ids:{trakt:this.ids.trakt},watched_at:date}]
				})
			}
			resolve()
		} else {
			this.watchers.push({
				watcher: user._id,
				watches: [{date:date}]
			})
			helpers.trakt(user).sync.history.add({
				episodes: [{ids:{trakt:this.ids.trakt},watched_at:date}]
			})
			resolve()
		}
	})
	.then(()=>{
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

episodeSchema.methods.getFilename = function(){
	let config = this.parent().config
	
	let vars = {
		S: require('zero-fill')(2,this.season),		// Number
		E: require('zero-fill')(2,this.episode),	// Number or Array
		T: '',										// String or Array
		X: 'mkv'
	}
	
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
		vars.T = this.title
	}
	
	let filename = config.format.replace(/%(\w)/g, function(match, key){
		return vars[key.toUpperCase()] ? vars[key.toUpperCase()] : key
	})
	return filename
}
episodeSchema.methods.getMagnet = function(){
	// Generate the magnet URL for the file
	
	// is the episode already downloaded?
	// is it downloading now?
	
	return new Promise((resolve,reject)=>{
		let config = this.parent().config
		let hashes = this.hashes.filter(item=>{
			 return item.hd === config.hd
		})
		if (!hashes.length) return reject()
		// Get REPACK/PROPER only
		
		
		// Sort by date DESC
		
		// Return first result
		
		hashes.sort((a,b)=>{
			if (a.added < b.added || a.repack == false) return 1
			if (a.added > b.added || a.repack == true) return -1
			return 0
		})
		helpers.torrents.createMagnet(hashes[0].btih).then(magnet=>resolve(magnet))
	})
}

episodeSchema.methods.setDownloading = function(hash){
	return new Promise(resolve=>{
		this.file.download.active = true
		this.file.download.hashString = hash
		resolve()
	})
}

module.exports = episodeSchema