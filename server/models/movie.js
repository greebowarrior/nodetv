"use strict"

const mongoose = require('mongoose')

let movieSchema = new mongoose.Schema({
	title: {type: String, required: true},
	overview: String,
	year: Number,
	ids: {
		guidebox: {type: Number, default: null},
		imdb: {type: String, default: null},
		slug: {type:String, lowercase:true, required: true, trim: true},
		tmdb: {type:Number, default:null},
		trakt: {type:Number, default:null, required: true}
	},
	watchers: [{
		_id: false,
		watcher: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		watches: [{
			_id: false,
			date: {type: Date, default: new Date()}
		}]
	}],
	hashes: [{
		_id: false,
		added: {type: Date, default: new Date()},
		btih: {type: String, uppercase: true, required: true},
		hash: String,
		hd: {type: Boolean, default: false},
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
		hash: String,
		quality: {type: String, enum: ['SD','720p','1080p']}
	},
	genres: Array,
	runtime: Number,
	added: {type: Date, default: new Date()},
	synced: {type: Date},
	updated: {type: Date, default: new Date()}
})

movieSchema.statics.findBySlug = function(slug){
	return this.findOne({
		'ids.slug': slug.toLowerCase().trim()
	})
}
movieSchema.statics.findByTrakt = function(trakt){
	return this.findOne({
		'ids.trakt': parseInt(trakt,10)
	})
}
movieSchema.statics.findByUser = function(user_id){
	return this.find({
		'subscribers.subscriber': mongoose.Types.ObjectId(user_id)
	})
}

movieSchema.methods.setWatched = function(user_id){
	return new Promise(resolve=>{
		let idx = this.watchers.findIndex(item=>item.watchers.equals(user_id))
		
		if (idx >= 0){
			this.watchers[idx].watches.push({date: new Date()})
		} else {
			this.watchers.push({watcher:user_id,watches:{date: new Date()}})
		}
		
		resolve(this)
	})
}
movieSchema.methods.setCollected = function(){
	if (!this.file.added) this.file.added = new Date()
	return this
}

movieSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})
module.exports = mongoose.model('Movie', movieSchema)