"use strict"

const helpers = require('nodetv-helpers')
const mongoose = require('mongoose')

//const Latest = require('./latest')

let movieSchema = new mongoose.Schema({
	title: {type: String, required: true},
	overview: String,
	year: Number,
	ids: {
		imdb: {type: String, default: null},
		slug: {type:String, lowercase:true, required: true, trim: true, unique:true},
		tmdb: {type:Number, default:null},
		trakt: {type:Number, default:null, required: true, unique:true}
	},
	subscribers: [{
		_id: false,
		rating: Number,
		subscriber: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
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
		quality: {type: String, enum: ['SD','720p','1080p','3D','4K']},
		size: {type: String}
	}],
	config: {
		directory: String,
		quality: {type: String, enum: ['SD','720p','1080p','3D','4K']},
		transcode: {type: Boolean, default: false}
	},
	file: {
		added: Date,
		download: {
			active: Boolean,
			hashString: String
		},
		filename: String,
		filesize: Number,
		hash: String,
		quality: {type: String, enum: ['SD','720p','1080p','3D','4K']},
		subtitles: String
	},
	images: {
		background: {
			enabled: {type: Boolean, default: false},
			files: [{
				_id: false,
				width: String,
				filename: String
			}],
			filename: String,
			source: String
		},
		banner: {
			enabled: {type: Boolean, default: false},
			files: [{
				_id: false,
				width: String,
				filename: String
			}],
			filename: String,
			source: String
		},
		poster: {
			enabled: {type: Boolean, default: false},
			files: [{
				_id: false,
				width: String,
				filename: String
			}],
			filename: String,
			source: String
		}
	},
	genres: [{
		_id: false,
		name: String
	}],
	runtime: Number,
	added: {type: Date, default: new Date()},
	synced: {type: Date, default: null},
	updated: {type: Date, default: new Date()}
},{
	toObject:{virtuals:true}, toJSON:{virtuals:true}
})

movieSchema.statics.findByHashString = function(hash,projection={},options={}){
	return this.findOne({
		'file.download.hashString': {$regex: new RegExp(hash, 'i')}
	},projection,options).exec()
}
movieSchema.statics.findBySlug = function(slug){
	return this.findOne({
		'ids.slug': slug.toLowerCase().trim()
	}).exec()
}
movieSchema.statics.findByTrakt = function(trakt){
	return this.findOne({
		'ids.trakt': parseInt(trakt,10)
	}).exec()
}
movieSchema.statics.findByUser = function(user){
	return this.find({
		'subscribers.subscriber': mongoose.Types.ObjectId(user._id)
	}).sort({title:1}).exec()
}

movieSchema.statics.updateLatest = function(){
	// TODO: Proxy support, cache support
	return require('request-promise')({url:process.env.YTS_API, json:true, proxy:false})
		.then(json=>{
			return json.data.movie_count >= 1 ? json.data.movies : []
		})
		.map(result=>{
			return this.findOne({'ids.imdb':result.imdb_code}).exec().then(movie=>{
				if (!movie){
					return null
					/*
					Latest.findOne({'ids.imdb': result.imdb_code}).exec().then()
					
					movie = new Latest({
						title: result.title,
						year: result.year,
						overview: result.summary,
						ids: {
							imdb: result.imdb_code,
							slug: result.slug
						}
					})
					*/
				}
				
				result.torrents.forEach(torrent=>{
					let idx = movie.hashes.findIndex(item=>item.btih == torrent.hash)
					
					if (idx == -1){
						movie.hashes.push({
							btih: torrent.hash,
							quality: torrent.quality,
							size: torrent.size,
							added: new Date(torrent.date_uploaded)
						})
					}
				})
				
				return movie.save({new:true})
			})
		})
		.catch(error=>{
			if (error) console.error(error.message)
		})
}
movieSchema.statics.syncCollection = function(user={}){
	return helpers.trakt(user).sync.collection.get({type:'movies'})
		.each(result=>{
			if (result.movie){
				this.findBySlug(result.movie.ids.slug)
					.then(movie=>{
						if (!movie) movie = new this(result.movie)
						return movie.sync(user)
					})
					.then(movie=>{
						return movie.subscribe(user).save({new:true})
					})
					.catch(error=>{
						if (error) console.error(error.message)
					})
			}
		})
}
movieSchema.statics.scanAll = function(){
	const directory = process.env.MEDIA_ROOT + process.env.MEDIA_MOVIES + 'A-Z/'
	
	return require('glob-promise')('*/*',{cwd:directory,nodir:true})
		.each(file=>{
			let match = file.match(/^(?:.\/)(.+)\s\((\d+)\)\s\[([\w]{2,4}p?)\]\.(\w{3,4})$/i)
			if (!match) return
			
			this.findOne({title: new RegExp(match[1].trim(), 'i'), year: parseInt(match[2],10)}).exec().then(movie=>{
				if (!movie) throw new Error(`Movie not found: ${match[1]} (${match[2]})`)
				
				movie.setQuality(match[3])
				
				const target = require('path').join(movie.getDirectory(), movie.getFilename(file))
				return helpers.files.move(directory+file, target)
					.then(()=>{
						movie.file.filename = movie.getFilename(file)
						return movie.save()
					})
			})
			.catch(error=>{
				if (error) console.error(error.message)
			})
		})
		.catch(error=>{
			if (error) console.error(error.message)
		})
}

movieSchema.methods.getAlpha = function(){
	let alpha = this.title.replace(/^(A\s|The\s|\W)/i,'').trim().substring(0,1)
	if (alpha.match(/^[\d]/)) alpha = '#'
	return alpha.toUpperCase()
}
movieSchema.methods.getDirectory = function(){
	if (!this.config.directory) this.setDirectory()
	
	return require('path').join(
		process.env.MEDIA_ROOT,
		process.env.MEDIA_MOVIES,
		'A-Z', this.getAlpha(),
		helpers.utils.normalize(this.config.directory)
	)
}
movieSchema.methods.getFilename = function(file){
	let ext = require('path').extname(file) || '.mp4'
	return helpers.utils.normalize(`${this.title} (${this.year}) [${this.file.quality}]${ext}`)
}
movieSchema.methods.getMediainfo = function(file){
	return require('mediainfo')(file)
}

movieSchema.methods.getInfoHash = function(){
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
			return hash.quality == this.config.quality
		})
		if (filtered.length) resolve(filtered[0])
	})
}
movieSchema.methods.parseFeed = function(){
	// TODO: add proxy support
	
	return Promise.try(()=>{
		if (!this.ids.imdb) throw new Error(`No IMDB ID: ${this.ids.slug}`)
		return require('request-promise').get({url:process.env.YTS_API, qs:{query_term:this.ids.imdb}, json:true, proxy:false})
	})
	.then(json=>{
		if (json.data.movie_count == 1){
			json.data.movies.forEach(movie=>{
				movie.torrents.forEach(torrent=>{
					let idx = this.hashes.findIndex(item=>item.btih == torrent.hash)
					if (idx == -1){
						this.hashes.push({
							btih: torrent.hash,
							quality: torrent.quality,
							size: torrent.size,
							added: new Date(torrent.date_uploaded)
						})
					}
				})
			})
		}
		return this.save()
	})
}

movieSchema.methods.subscribe = function(user){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user._id)
	})
	if (idx === -1){
		this.subscribers.push({subscriber:user._id})
		helpers.trakt(user).sync.watchlist.add({movies:[{ids:{trakt:this.ids.trakt}}]})
	}
	return this
}
movieSchema.methods.unsubscribe = function(user){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user._id)
	})
	if (idx >= 0) this.subscribers.splice(idx,1)
	helpers.trakt(user).sync.watchlist.remove({movies:[{ids:{trakt:this.ids.trakt}}]})
	helpers.trakt(user).sync.collection.remove({movies:[{ids:{trakt:this.ids.trakt}}]})
	return this
}

movieSchema.methods.setArtwork = function(data){
	return new Promise((resolve,reject)=>{
		if (!data.url) return reject(new Error(`No Source URL`))
		
		let target = require('path').join(this.getDirectory(), `${data.type}-original` + require('path').extname(data.url))
		
		helpers.files.download(data.url, target)
			.then(source=>{
				
				// Resize image
				let files = []
				let sizes = []
				
				switch (data.type){
					case 'background':
						sizes = [{
							width: 1920,
							suffix: 'large'
						}]
						break
					case 'banner':
						sizes = [{
							width: 575,
							suffix: 'small'
						},{
							width: 800,
							suffix: 'medium'
						},{
							width: 940,
							suffix: 'large'
						}]
						break
					case 'poster':
						sizes = [{
							width: 250,
							suffix: 'small'
						},{
							width: 500,
							suffix: 'medium'
						},{
							width: 1000,
							suffix: 'large'
						}]
						break
				}
				
				return require('fs-extra').readFile(source)
					.then(buffer=>{
						return Promise.all(sizes).each(size=>{
							let filename = source.replace(/-original/,`-${size.suffix}`)
							return require('sharp')(buffer).resize(size.width, null).toFile(filename)
								.then(()=>{
									files.push({
										filename: require('path').basename(filename),
										width: size.width
									})
									return true
								})
						})
					})
					.then(()=>{
						this.images[data.type] = {
							enabled: files.length ? true : false,
							files: files,
							source: data.url
						}
						resolve()
					})
			})
			.catch(error=>{
				if (error) console.error(error.message)
				reject(error)
			})
	})
}
movieSchema.methods.setCollected = function(file=null,date=null){
	if (!date) date = new Date()
	
	return Promise.each(this.subscribers, (user)=>{
		require('./user').findById(user.subscriber)
			.then(user=>{
				if (!user) throw new Error(`User not found`)
				helpers.trakt(user).sync.collection.add({
					movies: [{
						ids:{trakt:this.ids.trakt},
						collected_at: date.toISOString(),
						media_type: 'digital'
				//		resolution: helpers.utils.getTraktResolution(this.file.quality)
				//		'3d': this.file.quality === '3D' ? true : false
					}]
				})
			})
			.catch(error=>{
				if (error) console.error(error.message)
			})
		return true
	})
	.finally(()=>{
		if (file) this.file.filename = file
		this.file.added = date
		this.file.download.active = undefined
		
		return this
	})
}
movieSchema.methods.setDirectory = function(){
	this.config.directory = helpers.utils.normalize(`${this.title} (${this.year})`)
}
movieSchema.methods.setDownloading = function(hash){
	this.file.quality = hash.quality
	this.file.download.active = true
	this.file.download.hashString = hash.btih.toUpperCase()
	
	return Promise.resolve(this)
}
movieSchema.methods.setFilename = function(file){
	let ext = require('path').extname(file) || '.mp4'
	return helpers.utils.normalize(`${this.title} (${this.year}) [${this.file.quality}]${ext}`)
}
movieSchema.methods.setQuality = function(quality){
	if (quality.match(/480p/i)) quality = 'SD'
	this.file.quality = quality
	return this
}
movieSchema.methods.setWatched = function(user, date=null, id=null){
	if (!date) date = new Date()
	
	return new Promise(resolve=>{
		let idx = this.subscribers.findIndex(item=>{
			return item.subscriber.equals(user._id)
		})
		if (idx >= 0){
			let checkin = this.subscribers[idx].watches.findIndex(item=>{
				return item.id == id || item.date == new Date(date)
			})
			if (checkin >= 0){
				if (id) this.subscribers[idx].watches[checkin].id = id
			} else {
				this.subscribers[idx].watches.push({date:date,id:id})
			}
			resolve(id)
		} else {
			this.subscribers.push({
				subscriber: user._id,
				watches: [{date:date,id:id}]
			})
			resolve(id)
		}
	})
	.then(id=>{
		if (!id){
			helpers.trakt(user).sync.history.add({
				movies: [{ids:{trakt:this.ids.trakt},watched_at:date}]
			})
		}
		return this
	})
}

movieSchema.methods.play = function(user,url){
	return helpers.upnp.setDevice(url).then(device=>{
		let media = {
			title: `${this.title} (${this.year})`,
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
movieSchema.methods.scan = function(){
	// Scan the movie directory and find video files
	return require('glob-promise')('*.*',{cwd:this.getDirectory(),nodir:true})
		.each(file=>{
			if (require('path').extname(file) == '.srt'){
				this.file.subtitles = require('path').basename(file)
				return Promise.resolve()
			}
			
			let match = file.match(/^(.+)\s\((\d+)\)\s\[([\w]{2,4}p?)\]\.(\w{3,4})$/i)
			if (match){
				let filename = require('path').basename(file)
				this.setQuality(match[3])
				
				this.file.filename = require('path').basename(file)
				let source = require('path').join(this.getDirectory(),filename)
				
				return require('fs-extra').stat(source)
					.then(stat=>{
						this.file.added = new Date(stat.mtime)
						this.file.filesize = stat.size
						return Promise.resolve()
					})
			}
		})
		.then(()=>{
			if (this.file.added) this.setCollected(this.file.filename, this.file.added)
		})
		.finally(()=>this.save({new:true}))
}
movieSchema.methods.symlinks = function(){
	// Create genre symlinks in genres folder
	/*
	this.genres.forEach(genre=>{
		
	})
	*/
}
movieSchema.methods.sync = function(user={}){
	return helpers.trakt(user).movies.summary({id:this.ids.trakt, extended:'full'})
		.then(summary=>{
			if (this.synced < new Date(summary.updated_at)){
				this.ids = Object.assign({}, this.ids, summary.ids)
				this.year = summary.year
				this.synced = new Date(summary.updated_at)
			}
			this.title = helpers.utils.normalize(summary.title)
			this.overview = summary.overview
			this.runtime = summary.runtime
			this.genres = summary.genres.map(genre=>({name:genre}))
			return this
		})
}
movieSchema.methods.syncHistory = function(user={}){
	console.log(`${this.title}: Syncing watch history for ${user.username}`)
	
	return helpers.trakt(user).sync.history.get({type:'movies', id:this.ids.trakt})
		.then(history=>{
			if (!history) return
			history.forEach(watch=>{
				this.setWatched(user, new Date(watch.watched_at), watch.id)
			})
			return this.save({new:true})
		})
		.catch(error=>{
			console.debug(error)
		})
}

movieSchema.virtual('uri').get(function(){
	return `/api/movies/${this.ids.slug}`
})
movieSchema.virtual('file.url').get(function(){
	
	if (this.config.directory && this.file.filename){
		let url = [
			process.env.DLNA_URL || process.env.WEB_URL,
			'media/',
			process.env.MEDIA_MOVIES,
			'A-Z',
			this.getAlpha().replace('#','%23'),
			this.config.directory,
			this.file.filename
		]
		return url.map(item=>item.replace(/\/$/,'')).join('/')
	}
	/*
	if (this.config.directory && this.file.filename){
		return process.env.WEB_URL +'media/'+ process.env.MEDIA_MOVIES +'A-Z/'+ 
			this.getAlpha().replace('#','%23') +'/'+ this.config.directory +'/'+ this.file.filename
	}
	*/
})
movieSchema.virtual('images.baseUrl').get(function(){
	if (!this.config.directory) this.setDirectory()
	
	let root = process.env.MEDIA_MOVIES.replace(/\s/g,'%20')
	let directory = encodeURIComponent(this.config.directory)
	let alpha = this.getAlpha().replace('#','%23')
	return `/media/${root}A-Z/${alpha}/${directory}`
})

movieSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})
module.exports = mongoose.model('Movie', movieSchema)