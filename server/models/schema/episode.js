"use strict"

const mongoose = require('mongoose')

let episodeSchema = new mongoose.Schema({
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
	updated_at: Date,
	watchers: [{
		_id: false,
		watcher: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		count: {type: Number, default: 0},
		watches: [{
			_id: false,
			date: {type: Date, default: new Date()}
		}]
	}],
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
})

episodeSchema.methods.addInfoHash = function(data){
	return new Promise((resolve,reject)=>{
		if (!data.btih) return reject({error: `No Info Hash`})
		let idx = this.hashes.findIndex(item=>{return item.btih === data.btih})
		if (idx === -1){
			this.hashes.push({
				btih: data.btih,
				hd: data.hd,
				quality: data.quality,
				repack: data.repack,
				added: data.added
			})
		}
		resolve(this)
	})
}

// Need better naming for these 2 methods
episodeSchema.methods.download = function(){
	// Generate the magnet URL for the file
	
	return new Promise((resolve,reject)=>{
		let config = this.parent().config
		let hashes = this.hashes.filter(item=>{
			 return item.hd === config.hd
		})
		if (!hashes.length) return reject()
		hashes.sort((a,b)=>{
			if (a.added < b.added || a.repack == false) return 1
			if (a.added > b.added || a.repack == true) return -1
			return 0
		})
		resolve(hashes[0])
	})
}

episodeSchema.methods.downloaded = function(){
	
}

episodeSchema.methods.getFilename = function(){
	let config = this.parent().config
	
	let vars = {
		S: require('zero-fill')(2,this.season),
		E: require('zero-fill')(2,this.episode),
		T: this.title,
		X: 'mkv'
	}
	
	// TODO: Multi-episode files (i.e. E01-03 - Air)
	
	let filename = config.format.replace(/%(\w)/g, function(match, key){
		return vars[key.toUpperCase()] ? vars[key.toUpperCase()] : key
	})
//	this.file.filename = filename
	return filename
}

episodeSchema.methods.setCollected = function(){
	if (!this.file.added) this.file.added = new Date()
	return this
}
episodeSchema.methods.setWatched = function(user_id){
	return new Promise(resolve=>{
		let idx = this.watchers.findIndex(item => {return item.watcher.equals(user_id)})
		if (idx >= 0){
			this.watchers[idx].count += 1
		} else {
			this.watchers.push({watcher:user_id,count:1})
		}
		resolve(this)
	})
}

module.exports = episodeSchema