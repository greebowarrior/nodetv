"use strict"

const mongoose = require('mongoose')
const seasonSchema = require('./season')
const episodeSchema = require('./episode')

const helpers = require('nodetv-helpers')
const request = require('request-promise')
request.defaults({
	headers: {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
	}
})

const showSchema = new mongoose.Schema({
	ids: {
		guidebox: {type: Number},
		imdb: {type:String, default: null, trim: true},
		showrss: {type: Number},
		slug: {type:String, lowercase:true, required: true, trim: true},
		tmdb: {type:Number, default:null},
		trakt: {type:Number, default:null, required: true},
		tvdb: {type:Number, default:null},
		tvmaze: {type:Number}
	},
	config: {
		directory: {type: String, default: ''},
		enabled: {type: Boolean, default: false},
		feed: [{_id:false,url:String}],
		format: {type: String, default: 'Season %S/Episode %E - %T.%X'},
		hd: {type: Boolean, default: false},
		quality: {type: String, enum: ['SD','720p','1080p']},
		transcode: {type: Boolean, default: false}
	},
	title: {type: String, required: true},
	overview: String,
	year: {type: Number, required: true},
	first_aired: {type: Date},
	airs: {
		day: String,
		time: String,
		timezone: String
	},
	subscribers: [{
		_id: false,
		favourite: {type:Boolean, default:false},
		rating: Number,
		subscriber: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
	}],
	status: String,
	genres: [{
		_id: false,
		name: String
	}],
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
	seasons: [seasonSchema],
	episodes: [episodeSchema],
	
	added: {type: Date, default: new Date()},
	synced: {type: Date, default: null}, 
	updated: {type: Date, default: new Date()}
},{
	toObject:{virtuals:true}, toJSON:{virtuals:true}
})

// Statics
showSchema.statics.findByHashString = function(hash,projection={},options={}){
	return this.findOne({
		'episodes.file.download.hashString': {$regex: new RegExp(hash, 'i')}
	},projection,options)
}
showSchema.statics.findBySlug = function(slug,projection={}){
	return this.findOne({
		'ids.slug': slug.toLowerCase().trim()
	},projection)
}
showSchema.statics.findByTrakt = function(trakt,projection={},options={}){
	return this.findOne({
		'ids.trakt': parseInt(trakt,10)
	},projection,options)
}
showSchema.statics.findByUser = function(user,projection={},options={}){
	return this.find({
		'subscribers.subscriber': mongoose.Types.ObjectId(user._id)
	},projection,options)
}
showSchema.statics.findEnabled = function(projection={},options={}){
	return this.find({
		'config.enabled':true,
		'config.feed':{$exists:true}
	},projection,options).exec()
}

showSchema.statics.recentEpisodes = function(user,days=7){
	let now = new Date()
	let since = new Date()
	since.setDate(since.getDate()-days)
	
	return this.aggregate([
		{
			$match: {
				'subscribers.subscriber': user._id,
				$or: [
					{'episodes.file.added': {$gte:since, $lt:now}},
					{'episodes.first_aired': {$gte:since, $lt:now},'config.enabled':true}
				]
			}
		},{
			$unwind: '$episodes'
		},{
			$match: {
				$or: [
					{'episodes.file.added': {$gte:since, $lt:now}},
					{'episodes.first_aired': {$gte:since, $lt:now},'config.enabled':true}
				],
				'episodes.season': {$ne: 0}
			}
		},{
			$group: {
				_id: '$_id',
				title: {$first: '$title'},
				ids: {$first: '$ids'},
				episodes: {$push: '$episodes'}
			}
		}
	]).sort({title:1})
}
showSchema.statics.upcomingEpisodes = function(user,days=7){
	let now = new Date()
	let until = new Date()
	until.setDate(until.getDate()+days)
	
	return this.aggregate([
		{
			$match: {
				'config.enabled': true,
				'subscribers.subscriber': user._id,
				'episodes.first_aired': {$gte:now, $lt:until}
			}
		},{
			$unwind: '$episodes'
		},{
			$match: {
				'episodes.first_aired': {$gte:now, $lt:until},
				'episodes.file': {$exists: false},
				'episodes.season': {$ne: 0}
			}
		},{
			$group: {
				_id: '$_id',
				title: {$first: '$title'},
				ids: {$first: '$ids'},
				episodes: {$push: '$episodes'}
			}
		}
	]).sort({title:1})
}

// Methods
showSchema.methods.parseFeed = function(){
	// Parse the RSS feed, and update accordingly
	return new Promise((resolve,reject)=>{
		if (this.config.enabled && this.config.feed.length){
			// TODO: Support multiple feeds
			// TODO: Support proxying (for YTS, etc)
			
			request({url:this.config.feed[0].url, proxy:false})
				.then(xml=>{
					require('rss-parser').parseString(xml, (error,json)=>{
						if (json) resolve(json.feed.entries)
						if (error) reject(error)
					})
				})
				.catch(error=>{
					reject(error)
				})
		} else {
			reject(new Error(`Show not enabled: ${this.title}`))
		}
	})
	.map(entry=>{
		return helpers.utils.getEpisodeNumbers(entry.title)
			.then(result=>{
				result.episodes.forEach(ep=>{
					let episodes = this.episodes.filter(item=>{
						return item.season == result.season && item.episode == ep
					})
					episodes.forEach(episode=>{
						episode.setInfoHash({
							btih: helpers.utils.getInfoHash(entry),
							hd: helpers.utils.isHD(entry.title),
							linked: result.episodes,
							multi: result.episodes.length > 1 ? true : false,
							quality: helpers.utils.getQuality(entry.title),
							repack: helpers.utils.isRepack(entry.title),
							proper: helpers.utils.isProper(entry.title),
							added: new Date(entry.pubDate)
						})
					})
				})
				return null
			})
	})
	.then(()=>{
		return this.save({new:true})
	})
	.catch(error=>{
		if (error) console.error(`${this.title}: `, error.statusCode)
	})
}
showSchema.methods.subscribe = function(user){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user._id)
	})
	if (idx === -1){
		this.subscribers.push({subscriber:user._id})
		helpers.trakt(user).sync.watchlist.add({shows:[{ids:{trakt:this.ids.trakt}}]})
	}
	return this
}
showSchema.methods.unsubscribe = function(user){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user._id)
	})
	if (idx >= 0) this.subscribers.splice(idx,1)
	
	// Remove from watchlist & collection
	helpers.trakt(user).sync.collection.remove({shows:[{ids:{trakt:this.ids.trakt}}]})
	helpers.trakt(user).sync.watchlist.remove({shows:[{ids:{trakt:this.ids.trakt}}]})
	return this
}

showSchema.methods.hasRecentEpisodes = function(days=7){
	return new Promise(resolve=>{
		let since = new Date()
		since.setDate(since.getDate()-days)
		let results = this.episodes.filter(episode=>{
			if (episode.first_aired >= since && episode.first_aired <= new Date()) return true
		//	if (episode.first_aired >= since) return true
		})
		resolve(results)
	})
}

showSchema.methods.getDirectory = function(){
	if (!this.config.directory) this.setDirectory()
	
	return require('path').join(
		process.env.MEDIA_ROOT,
		process.env.MEDIA_SHOWS,
		helpers.utils.normalize(this.config.directory)
	)
}
showSchema.methods.getEpisode = function(season,episode){
	return new Promise((resolve,reject)=>{
		let idx = this.episodes.findIndex(item=>{
			return item.season == parseInt(season,10) && item.episode == parseInt(episode,10)
		})
		if (idx == -1) return reject(new Error(`Episode not found: ${this.title} ${season}x${episode}`))
		
		resolve(this.episodes.id(this.episodes[idx]._id))
	})
}
showSchema.methods.getLatestEpisodes = function(days=7){
	return new Promise(resolve=>{
		let since = new Date()
		since.setDate(since.getDate()-days)
		let results = this.episodes.filter(episode=>{
		//	if (episode.first_aired >= since && episode.first_aired <= new Date()) return true
			if (episode.first_aired >= since && episode.hashes.length) return true
		})
		resolve(results)
	})
}
showSchema.methods.getSubscribers = function(){
	let subscribers = []
	this.subscribers.forEach(subscriber=>{
		subscribers.push(require('../user').findById(subscriber.subscriber))
	})
	return Promise.all(subscribers)
}

showSchema.methods.setTVMazeID = function(){
	return require('request-promise')({
		json: true,
		uri: `https://api.tvmaze.com/lookup/shows`,
		qs: {tvdb: this.ids.tvdb, imdb:this.ids.imdb}
	}).then(res=>{
		if (res.data.id) this.ids.tvmaze = res.data.id
	})
	.catch(error=>{
		if (error) console.debug(error.message)
	})
	.finally(()=>{
		return this
	})
}

showSchema.methods.setArtwork = function(data){
	return new Promise((resolve,reject)=>{
		if (!data.url) return reject()
		
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
				if (error) console.error(error)
				reject(error)
			})
	})
}
showSchema.methods.setDirectory = function(){
	this.config.directory = helpers.utils.normalize(this.title)
}

showSchema.methods.setCollected = function(){
	this.episodes.forEach(episode=>{
		episode.setCollected()
	})
	return this
}
showSchema.methods.setWatched = function(user){
	this.episodes.forEach(episode=>{
		episode.setWatched(user)
	})
	return this
}
showSchema.methods.setUnwatched = function(user){
	this.episodes.forEach(episode=>{
		episode.setUnwatched(user)
	})
	return this
}

showSchema.methods.match = function(){
	// ISSUES: Shows with reboots
	// e.g. Doctor Who (1963/2005)
	
	return new Promise((resolve,reject)=>{
		const base = require('path').join(process.env.MEDIA_ROOT, process.env.MEDIA_SHOWS)
		
		// If a directory exists that has the *exact* same name as the show, assume it's the folder for this show
		if (this.config.directory && require('fs-sync').existsSync(this.getDirectory())){
			return resolve(this.config.directory)
		}
		
		if (require('fs-extra').existsSync(require('path').join(base,this.title))){
			this.config.directory = this.title
			return resolve(this.config.directory)
		} else {
			require('fs-extra').ensureDir(require('path').join(base,this.title)).then(()=>{
				this.config.directory = this.title
				return resolve(this.config.directory)
			})
		}
		reject()
	})
}

showSchema.methods.scan = function(){
	const directory = this.getDirectory()
	
	if (!directory) return
	
	let promises = []
	return helpers.utils.walkDir(directory)
		.then(files=>{
			// Pass file through regex, update document, rename file (if necessary)
			files.forEach(file=>{
				let promise = helpers.utils.getEpisodeNumbers(file)
					.then(data=>{
						
						let idx = this.episodes.findIndex(item=>{
							return item.season == data.season && data.episodes.indexOf(item.episode) >= 0
						})
						if (idx == -1) return
						const formatted = this.episodes[idx].getFilename(file)
						
						return require('fs-extra').lstat(require('path').join(directory,file))
							.then(stat=>{
								this.episodes[idx].file.added = stat.mtime
								this.episodes[idx].file.filename = formatted
								this.episodes[idx].file.filesize = stat.size
								
								if (file != formatted){
									let source = require('path').join(directory, file)
									let target = require('path').join(directory, formatted)
									// Rename file
									return helpers.files.move(source, target)
										.then(()=>{
											this.episodes[idx].file.filename = formatted
											return formatted
										})
								} else {
									return formatted
								}
							})
							.catch(error=>{
								console.error(error.message)
							})
					})
					.catch(()=>{
						console.debug(`${this.title}: '${file}' is not a valid episode filename`)
						return null
					})
				promises.push(promise)
			})
			return Promise.all(promises)
		})
		.then(resolved=>{
			console.debug('Scan Complete', resolved)
			return this.save()
		})
}

showSchema.methods.sync = function(){
	// Sync data from Trakt
	return helpers.trakt().shows.summary({id:this.ids.slug, extended:'full'})
		.then(summary=>{
			
			if (this.synced < new Date(summary.updated_at)){
				this.ids = Object.assign({}, this.ids, summary.ids)
				this.year = summary.year
				this.status = summary.status
				this.synced = new Date(summary.updated_at)
			}
			
			this.title = helpers.utils.normalize(summary.title)
			this.overview = helpers.utils.normalize(summary.overview)
			this.first_aired = new Date(summary.first_aired)
			this.airs = summary.airs
			this.genres = summary.genres.map(genre=>({name:genre}))
			
			require('fs-extra').ensureDir(this.getDirectory())
			
			return helpers.trakt().seasons.summary({id:this.ids.slug,extended:'episodes,full'})
		})
		
		.then(seasons=>{
			if (!seasons.length) throw new Error(`No seasons found`)
			
			seasons.forEach(season=>{
				
				let idx = this.seasons.findIndex(item=>{
					return item.season == season.number
				})
				
				this.episodes.forEach(item=>{
					if (item.season == season.number && item.episode > season.episode_count){
						item.remove()
					}
				})
				
				if (idx == -1){
					this.seasons.push({
						season: season.number,
						ids: season.ids,
						overview: helpers.utils.normalize(season.overview || null)
					})
				} else {
					if (season.overview) this.seasons[idx].overview = helpers.utils.normalize(season.overview)
				}
				
				(season.episodes || []).forEach(episode=>{
					let idx = this.episodes.findIndex(item=>{
						return item && item.season == season.number && item.episode == episode.number
					})
					
					if (idx == -1){
						this.episodes.push({
							season: season.number,
							episode: episode.number,
							ids: episode.ids,
							title: helpers.utils.normalize(episode.title || 'TBA'),
							overview: helpers.utils.normalize(episode.overview || 'TBA'),
							first_aired: episode.first_aired ? new Date(episode.first_aired) : null,
							updated_at: episode.updated_at ? new Date(episode.updated_at) : null
						})
						
						helpers.utils.normalize(episode.title)
					} else {
						this.getEpisode(season.number,episode.number)
							.then(ep=>{
								ep.title = helpers.utils.normalize(episode.title || 'TBA')
								ep.updated_at = new Date(episode.updated_at)
								
								if (episode.first_aired) ep.first_aired = new Date(episode.first_aired)
								if (!episode.first_aired) ep.first_aired = undefined
								if (episode.overview) ep.overview = helpers.utils.normalize(episode.overview)
							})
					}
				})
			})
			return this
		})
		.catch(error=>{
			if (error) console.error(this.title, error)	
		})
}
showSchema.methods.syncHistory = function(user){
	// Sync full episode history
	return helpers.trakt(user).sync.history.get({type:'shows', id:this.ids.trakt, start_at:this.first_aired , limit:200})
		.then(history=>{
			if (!history) return
			
			let promises = []
			
			history.forEach(watch=>{
				let promise = this.getEpisode(watch.episode.season, watch.episode.number)
					.then(episode=>{
						return episode.setWatched(user, new Date(watch.watched_at), watch.id)
					})
					.catch(error=>{
						console.debug(error)
					})
				promises.push(promise)
			})
			return Promise.all(promises).then(()=>{
				console.log(`Saving ${this.title}`)
				return this.save({new:true})
			})
		})
		.catch(error=>{
			console.debug(error)
		})
}

showSchema.virtual('uri').get(function(){
	return `/api/shows/${this.ids.slug}`
})

showSchema.virtual('images.baseUrl').get(function(){
	let root = process.env.MEDIA_SHOWS.replace(/\s/g,'%20')
	let directory = encodeURIComponent(this.config.directory)
	return `/media/${root}${directory}`
})

showSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})
showSchema.post('findOne', function(doc,next){
	if (doc){
		if (!doc.config.quality) doc.config.quality = doc.config.hd ? '720p' : 'SD'
	}
	next()
})

module.exports = showSchema