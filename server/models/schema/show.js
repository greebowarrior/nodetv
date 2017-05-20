"use strict"

const mongoose = require('mongoose')
const seasonSchema = require('./season')
const episodeSchema = require('./episode')

//const guidebox = new (require('guidebox'))(global.config.guidebox.apikey,'GB')

const helpers = require('nodetv-helpers')
const request = require('request-promise')

const showSchema = new mongoose.Schema({
	ids: {
		guidebox: {type: Number, default: null},
		imdb: {type:String, default: null, trim: true},
		showrss: {type: Number, default: null},
		slug: {type:String, lowercase:true, required: true, trim: true},
		tmdb: {type:Number, default:null},
		trakt: {type:Number, default:null, required: true},
		tvdb: {type:Number, default:null}
	},
	config: {
		directory: {type: String, default: ''},
		enabled: {type: Boolean, default: false},
		feed: [{_id:false,url:String}],
		format: {type: String, default: 'Season %S/Episode %E - %T.%X'},
		hd: {type: Boolean, default: false},
		transcode: {type: Boolean, default: false}
	},
	title: {type: String, required: true},
	overview: String,
	year: {type: Number, required: true},
	subscribers: [{
		_id: false,
		subscriber: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
	}],
	status: String,
	genres: Array,
	images: {
		background: {type: Boolean, default: false},
		cover: {type: Boolean, default: false},
		poster: {type: Boolean, default: false}
	},
	seasons: [seasonSchema],
	episodes: [episodeSchema],
	
	added: {type: Date, default: new Date()},
	synced: {type: Date, default: null}, 
	updated: {type: Date, default: new Date()}
})

// Statics
showSchema.statics.findByHashString = function(hash,projection={},options={}){
	return this.findOne({
		'episodes.file.download.hashString':hash
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
showSchema.statics.findByUser = function(user_id,projection={},options={}){
	return this.find({
		'subscribers.subscriber': mongoose.Types.ObjectId(user_id)
	},projection,options)
}
showSchema.statics.findEnabled = function(projection={},options={}){
	return this.find({
		'config.enabled':true,'config.feed':{$exists:true}
	},projection,options)
}

showSchema.statics.recentEpisodes = function(days=7){
	let now = new Date()
	let since = new Date()
	since.setDate(since.getDate()-days)
	
	return this.find({
		'config.enabled': true,
		'episodes.first_aired': {$gte:since, $lte:now}
	},{
		episodes: {$elemMatch:{'first_aired':{$gte:since,$lt:now}}},
		ids: true,
		title: true
	}).sort({title: 1})
}
showSchema.statics.upcomingEpisodes = function(days=7){
	let now = new Date()
	let until = new Date()
	until.setDate(until.getDate()+days)
	
	return this.find({
		'config.enabled': true,
		'episodes.first_aired': {$gte:now, $lte:until}
	},{
		episodes: {$elemMatch:{'first_aired':{$gte:now,$lt:until}}},
		ids: true,
		title: true
	}).sort({title:1})
}

// Methods
showSchema.methods.parseFeed = function(){
	// Parse the RSS feed, and update accordingly
	return new Promise((resolve,reject)=>{
		if (this.config.enabled && this.config.feed.length){
			// TODO: Support multiple feeds
			// TODO: Support proxying (for YTS, etc)
			
			
			request(this.config.feed[0].url, {proxy:false})
				.then(xml=>{
					require('rss-parser').parseString(xml, (error,json)=>{
						if (json) resolve(json)
						if (error) reject(error)
					})
				})
				.catch(error=>{
					console.error(error)
					reject(error)
				})
		} else {
			reject({error: `Show not enabled: ${this.title}`})
		}
	})
	.then(json=>{
		let promises = []
		
		json.feed.entries.forEach(entry=>{
			let promise = helpers.utils.getEpisodeNumbers(entry.title)
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
								quality: helpers.utils.getQuality(entry.title),
								repack: helpers.utils.isRepack(entry.title),
								added: new Date(entry.pubDate)
							})
						})
					})
					return null
				})
			promises.push(promise)
		})
		
		return Promise.all(promises)
	})
	.then(()=>{
		return this.save()
	})
	.catch(error=>{
		if (error) console.error(error)
	})
}
showSchema.methods.subscribe = function(user_id){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user_id)
	})
	if (idx === -1){this.subscribers.push({subscriber:user_id})}
	return this
}
showSchema.methods.unsubscribe = function(user_id){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user_id)
	})
	if (idx >= 0){this.subscribers.splice(idx,1)}
	
	// TODO: Trakt - remove from collection (but keep watches)
	
	return this
}

showSchema.methods.getDirectory = function(){
	// TODO: Sanitize filepaths
	if (this.config.directory){
		return require('path').join(global.config.media.base, global.config.media.shows.path, this.config.directory)
	}
	return false
}
showSchema.methods.getLatestEpisodes = function(days=7){
	return new Promise(resolve=>{
		let since = new Date()
		since.setDate(since.getDate()-days)
		let results = this.episodes.filter(episode=>{
			if (episode.first_aired >= since && episode.first_aired <= new Date()) return true
		})
		resolve(results)
	})
}
showSchema.methods.getSubscribers = function(){
	let subscribers = []
	this.subscribers.forEach(subscriber=>{
	//	console.log(subscriber)
		subscribers.push(require('../user').findById(subscriber.subscriber))
	})
	return Promise.all(subscribers)
}

showSchema.methods.setArtwork = function(data){
	// Fetch artwork, save to show directory
	return new Promise((resolve,reject)=>{
		let target = require('path').join(this.getDirectory(), data.type + require('path').extname(data.url))
		let output = require('fs-extra').createWriteStream(target)
		output.on('error', error=>{
			console.error(error)
			reject(error)
		})
		output.on('close', ()=>{
			this.images[data.type] = true
			resolve()
		})
		require('request').get({uri: data.url}).pipe(output)
	})
}
showSchema.methods.setCollected = function(){
	this.episodes.forEach(episode=>{
		episode.setCollected()
	})
	return this
}
showSchema.methods.setDirectory = function(){
	// Use to rename an existing directory
	// or create one if it doesn't already exist
}
showSchema.methods.setWatched = function(){
	this.episodes.forEach(episode=>{
		episode.setWatched()
	})
	return this
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
						
						const formatted = this.episodes[idx].getFilename()
						
						this.episodes[idx].file.filename = formatted
						
						if (file != formatted){
							let source = require('path').join(directory, file)
							let target = require('path').join(directory, formatted)
							// Rename file
							return helpers.files.move(source, target)
						} else {
							return true
						}
					})
				promises.push(promise)
			})
			return Promise.all(promises)
		})
		.then(()=>{
			return this.save()
		})
}
showSchema.methods.sync = function(user){
	// Sync data from Trakt
	
	//  TODO: skip syncing if it's been done 'recently'
	// (TODO: define recently)
	
	return helpers.trakt(user).shows.summary({id:this.ids.slug, extended:'full'})
		.then(summary=>{
			
			if (!this.config.directory){
				// Create a directory based on the name
				this.config.directory = summary.title
				require('fs-extra').ensureDir(this.getDirectory())
			}
			
			if (this.synced < new Date(summary.updated_at)){
				this.ids = Object.assign({}, this.ids, summary.ids)
				this.overview = summary.overview
				this.year = summary.year
				this.status = summary.status
				this.synced = new Date(summary.updated_at)
				this.title = summary.title
			}
			return helpers.trakt().seasons.summary({id:this.ids.slug,extended:'episodes,full'})
		})
		
		.then(seasons=>{
			if (!seasons.length) throw new Error(`No seasons found`)
			seasons.forEach(season=>{
				let idx = this.seasons.findIndex(item=>{
					return item.season == season.number
				})
				if (idx == -1){
					this.seasons.push({
						season: season.number,
						ids: season.ids,
						overview: season.overview || null
					})
				} else {
					if (season.overview) this.seasons[idx].overview = season.overview
				}
				
				(season.episodes || []).forEach(episode=>{
					let idx = this.episodes.findIndex(item=>{
						return item.season == season.number && item.episode == episode.number
					})
					if (idx == -1){
						this.episodes.push({
							season: season.number,
							episode: episode.number,
							ids: episode.ids,
							title: episode.title || 'TBA',
							overview: episode.overview || 'TBA',
							first_aired: episode.first_aired ? new Date(episode.first_aired) : null,
							updated_at: episode.updated_at ? new Date(episode.updated_at) : null
						})
					} else {
						if (this.episodes[idx].updated_at < new Date(episode.updated_at)){
							this.episodes[idx].title = episode.title || 'TBA'
							this.episodes[idx].updated_at = new Date(episode.updated_at)
							
							if (episode.first_aired) this.episodes[idx].first_aired = new Date(episode.first_aired)
							if (!episode.first_aired) this.episodes[idx].first_aired = undefined
							if (episode.overview) this.episodes[idx].overview = episode.overview
						}
					}
				})
			})
			return this
		})
		.catch(error=>{
			if (error) console.error(this.title, error.message)	
		})
		/*
		.finally(()=>{
			// Get Guidebox ID
			return new Promise(resolve=>{
				if (this.ids.imdb && !this.ids.guidebox){
					guidebox.search.shows({field:'id',id_type:'imdb',query:this.ids.imdb})
						.then(result=>{
							this.ids.guidebox = result.id
							resolve(this)
						})
				} else {
					resolve(this)
				}
			})
		})
		*/
}

showSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})

module.exports = showSchema