"use strict";

var mongoose = require('mongoose');

var episodeSchema = require('./episode.schema');

var seasonSchema = new mongoose.Schema({
	ids: {
		imdb: String,
		tmdb: Number,
		trakt: Number,
		tvdb: Number
	},
	season: {type: Number, required: true},
	overview: String,
	episodes: [episodeSchema]
},{_id: false});

seasonSchema.methods.getEpisode = function(episode){
	return new Promise((resolve,reject)=>{
		var idx = this.episodes.findIndex(item => {return item.episode === parseInt(episode,10)});
		if (idx >= 0){
			resolve(this.episodes[idx]);
		} else {
			reject({error: 'Episode not found', season: this.season, episode: episode});
		}
	});
};
seasonSchema.methods.setCollected = function(){
	this.episodes.forEach(episode=>{
		episode.setCollected();
	});
	return this;
};

module.exports = seasonSchema;
