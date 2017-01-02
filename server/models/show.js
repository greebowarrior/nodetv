"use strict";

var mongoose = require('mongoose');

var seasonSchema = require('./season.schema');

var showSchema = new mongoose.Schema({
	ids: {
		imdb: {type:String, default: null, trim: true},
		slug: {type:String, lowercase:true, required: true, trim: true},
		tmdb: {type:Number, default:null},
		trakt: {type:Number, default:null, required: true},
		tvdb: {type:Number, default:null},
		tvrage: {type:Number, default:null}
	},
	config: {
		directory: String,
		enabled: {type: Boolean, default: false},
		feed: String,
		format: {type: String, default: 'Season %S/Episode %E - %T'},
		hd: {type: Boolean, default: false},
		transcode: {type: Boolean, default: false}
	},
	title: {
		type: String, required: true
	},
	overview: String,
	year: {
		type: Number, required: true
	},
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
	added: {
		type: Date, default: new Date()
	},
	updated: {
		type: Date, default: new Date()
	}
});

showSchema.statics.findBySlug = function(slug,projection={}){
	return this.findOne({
		'ids.slug': slug.toLowerCase().trim()
	},projection);
};
showSchema.statics.findByTrakt = function(trakt){
	return this.findOne({
		'ids.trakt': parseInt(trakt,10)
	});
};

showSchema.statics.findByUser = function(user_id,projection={},options={}){
	return this.find({
		'subscribers.subscriber': mongoose.Types.ObjectId(user_id)
	},projection,options);
};

showSchema.statics.findLatestEpisodes = function(user_id,projection={},options={}){
	// Get past 7 days
	let weekAgo = new Date();
	weekAgo.setDate(weekAgo.getDate()-7);
		
	return this.find({
		'subscribers.subscriber': mongoose.Types.ObjectId(user_id),
		'seasons.episodes.first_aired': {
		//	$lte: new Date(),
			$gte: new Date(weekAgo)
		}
	},projection,options)
		.then(shows=>{
			let response = [];
			
			shows.forEach(show=>{
				show.seasons.forEach(season=>{
					show.episodes = season.episodes.filter(item=>{
						return item.first_aired <= new Date() && item.first_aired >= weekAgo ? true : false;
					});
				})
				console.debug('cunt');
				delete show.seasons;
				
				response.push(show);
			});
			
			console.log(response);
			
			return response;
		})
};

showSchema.methods.getSeason = function(season_id){
	return new Promise((resolve,reject)=>{
		var idx = this.seasons.findIndex(item => {return item.season===parseInt(season_id,10)});
		if (idx >= 0){
			resolve(this.seasons[idx]);
		} else {
			reject({});
		}
	})
};
showSchema.methods.getEpisode = function(season_id, episode_id){
	return new Promise((resolve,reject)=>{
		this.getSeason(season_id)
			.then(season=>{
				return season.getEpisode(episode_id);
			})
			.then(episode=>{
				resolve(episode);
			})
			.catch(error=>{
				reject(error);
			});
	});
}

showSchema.methods.setCollected = function(){
	this.seasons.forEach(season=>{
		season.setCollected();
	});
	return this;
};

showSchema.methods.setWatched = function(){
	this.seasons.forEach(season=>{
		season.setWatched();
	});
	return this;
};

showSchema.methods.subscribe = function(user_id){
	var idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user_id);
	});
	if (idx === -1){this.subscribers.push({subscriber:user_id})}
	return this;
};

showSchema.methods.unsubscribe = function(user_id){
	var idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user_id);
	});
	if (idx >= 0){this.subscribers.splice(idx,1)}
	return this;
};

showSchema.pre('save', function(next){
	this.updated = new Date();
	next();
});

module.exports = mongoose.model('Show', showSchema);