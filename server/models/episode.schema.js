"use strict";

var mongoose = require('mongoose');

var episodeSchema = new mongoose.Schema({
	ids: {
		imdb: String,
		tmdb: Number,
		trakt: Number,
		tvdb: Number
	},
	episode: {type: Number, required: true},
	title: {type: String, required: true},
	overview: String,
	first_aired: Date,
	updated_at: Date,
	watchers: [
		{
			_id: false,
			watcher: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
			count: {type: Number, default: 0},
			watches: [{
				_id: false,
				date: {type: Date, default: new Date()}
			}]
		}
	],
	hashes: [{
		_id: false,
		added: {type: Date, default: new Date()},
		btih: {type: String, uppercase: true},
		hash: String,
		hd: {type: Boolean, default: false},
		quality: {type: String, enum: ['SD','720p','1080p']},
		repack: {type: Boolean, default: false}
	}],
	file: {
		added: Date,
		downloading: Boolean,
		filename: String,
		filesize: Number,
		hash: String,
		quality: {type: String, enum: ['SD','720p','1080p']}
	}
},{_id:false});

episodeSchema.methods.addInfoHash = function(data){
	return new Promise((resolve,reject)=>{
		if (!data.btih) return reject({error: 'No Info Hash'})
		var idx = this.hashes.findIndex(item=>{return item.btih === data.btih});
		if (idx === -1){
			this.hashes.push({
				btih: data.btih,
				hd: data.hd,
				repack: data.repack
			});
		}
		resolve(this);
	});
};

episodeSchema.methods.setWatched = function(user_id){
	return new Promise(resolve=>{
		var idx = this.watchers.findIndex(item => {return item.watcher.equals(user_id)});
		if (idx >= 0){
			this.watchers[idx].count += 1;
		} else {
			this.watchers.push({watcher:user_id,count:1});
		}
		resolve(this);
	});
};
episodeSchema.methods.setCollected = function(){
	if (!this.file.added) this.file.added = new Date();
	return this;
};


module.exports = episodeSchema;