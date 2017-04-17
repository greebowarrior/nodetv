"use strict"

const mongoose = require('mongoose'),
	seasonSchema = require('./season'),
	episodeSchema = require('./episode')

const utils = global.helper('modules/utils')

let showSchema = new mongoose.Schema({
	ids: {
		imdb: {type:String, default: null, trim: true},
		slug: {type:String, lowercase:true, required: true, trim: true},
		tmdb: {type:Number, default:null},
		trakt: {type:Number, default:null, required: true},
		tvdb: {type:Number, default:null}
	},
	config: {
		directory: String,
		enabled: {type: Boolean, default: false},
		feed: Array,
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

showSchema.statics.findBySlug = function(slug,projection={}){
	return this.findOne({
		'ids.slug': slug.toLowerCase().trim()
	},projection)
}
showSchema.statics.findByTrakt = function(trakt){
	return this.findOne({
		'ids.trakt': parseInt(trakt,10)
	})
}
showSchema.statics.findByUser = function(user_id,projection={},options={}){
	return this.find({
		'subscribers.subscriber': mongoose.Types.ObjectId(user_id)
	},projection,options)
}

showSchema.statics.findEnabled = function(){
	return this.find({'config.enabled':true,'config.feed':{$exists:true}})
}
showSchema.statics.findByEpisodeHash = function(hash){
	return this.findOne({'episodes.hashes.hash': hash})
}

showSchema.methods.download = function(season=null,episode=null){
	return new Promise(resolve=>{
		if (season && episode){
			let idx = this.episodes.findIndex(item=>{
				return item.season === season && item.episode === episode
			})
			if (idx){
				return this.episodes[idx].download()
			}
		}
		
	//	this.episodes.forEach(episode=>{
	//		episode.download()
	//	})
		resolve(this)
	})
}

showSchema.methods.getLatestEpisodes = function(days=7){
	return new Promise(resolve=>{
		let since = new Date()
		since.setDate(since.getDate()-days)
		
		let results = this.episodes.filter(episode=>{
			if (episode.first_aired <= new Date() && episode.first_aired >= since) return true
		})
		resolve(results)
	})
}

/*
showSchema.methods.setCollected = function(){
	this.seasons.forEach(season=>{
		season.setCollected()
	})
	return this
}
showSchema.methods.setWatched = function(){
	this.seasons.forEach(season=>{
		season.setWatched()
	})
	return this
}
*/

/*
showSchema.statics.findLatestEpisodes = function(user_id,projection={},options={}){
	// Get past 7 days
	let weekAgo = new Date()
	weekAgo.setDate(weekAgo.getDate()-7)
		
	return this.find({
		'subscribers.subscriber': mongoose.Types.ObjectId(user_id),
		'seasons.episodes.first_aired': {
		//	$lte: new Date(),
			$gte: new Date(weekAgo)
		}
	},projection,options)
		.then(shows=>{
			let response = []
			
			shows.forEach(show=>{
				show.seasons.forEach(season=>{
					show.episodes = season.episodes.filter(item=>{
						return item.first_aired <= new Date() && item.first_aired >= weekAgo ? true : false
					})
				})
				console.debug('cunt')
				delete show.seasons
				
				response.push(show)
			})
			
			console.log(response)
			
			return response
		})
}

showSchema.methods.getNextEpisode = function(){
	this.findOne({'seassons.$.episodes.first_aired':{$gte: new Date()}}, {'seasons.$':true})
		.then(season=>{
			console.log(season)
		})
}



showSchema.methods.getSeason = function(season_id){
	return new Promise((resolve,reject)=>{
		let idx = this.seasons.findIndex(item => {return item.season===parseInt(season_id,10)})
		if (idx >= 0){
			// get episodes from episode list
			let episodes = this.episodes.filter(episode=>{
				return episode.season == season_id
			})
			this.seasons[idx].episodes = episodes
			resolve(this.seasons[idx])
		} else {
			reject({})
		}
	})
}

showSchema.methods.getEpisode = function(season_id, episode_id){
	return new Promise((resolve,reject)=>{
		
		let episodes = this.episodes.filter(item=>{
			return item.season == season_id && item.episode == episode_id 
		})
		
		if (episodes.length) resolve(episodes[0])
		reject()
		/*
		this.getSeason(season_id)
			.then(season=>{
				return season.getEpisode(episode_id)
			})
			.then(episode=>{
				resolve(episode)
			})
			.catch(error=>{
				reject(error)
			})
		*/
/*
*/

showSchema.methods.episodeNumbers = function(text){
	// TODO: Add alternative regexps
	const regexp = /(?:[a-z]+)?\s?(\d{1,2})(?:\:[\w\s]+)?[\/\s]*(?:E|x|[a-z]{2,})\s?([\d]+)(?:(?:E|-)\s?([\d]{2,})){0,}/i
	
	return new Promise((resolve,reject)=>{
		if (text.match(regexp)){
			let match = text.match(regexp)
			let response = {
				season: parseInt(match[1],10),
				episodes: []
			}
			let i = parseInt(match[2],10), range = match[3] || match[2]
			do {response.episodes.push(i++)} while (i <= range)
			resolve(response)
		}
		reject()
	})
}
showSchema.methods.parseFeed = function(){
	// Parse the RSS feed, and update accordingly
	return new Promise((resolve,reject)=>{
		if (this.config.enabled && this.config.feed){
			require('rss-parser').parseURL(this.config.feed[0], function(error,json){
				if (json) resolve(json)
				reject(error)
			})
		} else {
			reject({error: `Show not enabled: ${this.title}`})
		}
	})
	.then(json=>{
		json.feed.entries.forEach(entry=>{
			this.episodeNumbers(entry.title)
				.then(result=>{
					result.episodes.forEach(episode=>{
						let idx = this.episodes.findIndex(item=>{
							if (item.season == result.season && item.episode == episode) return true
							return false
						})
						if (idx >= 0){
							this.episodes[idx].addInfoHash({
								btih: utils.getInfoHash(entry),
								hd: utils.isHD(entry.title),
								quality: utils.getQuality(entry.title),
								repack: utils.isRepack(entry.title),
								added: new Date(entry.pubDate)
							})
						}
					})
				})
		})
		return this.save()
	})
	.catch(error=>{
		console.error(error)
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
	return this
}


showSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})

module.exports = showSchema