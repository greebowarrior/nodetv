"use strict"

const mongoose = require('mongoose')

let movieSchema = new mongoose.Schema({
	title: {type: String, required: true},
	year: Number,
	ids: {
		slug: {type:String, lowercase:true},
		tmdb: {type:Number, default:null},
		trakt: {type:Number, default:null}
	},
	subscribers: [{
		_id: false,
		subscriber: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		count: {type: Number, default: 0}
	}],
	hashes: [{
		_id: false,
		added: {type: Date, default: new Date()},
		btih: String,
		hash: String,
		hd: Boolean,
		quality: {type: String, enum: ['SD','720p','1080p']}
	}],
	file: {
		added: Date,
		downloading: Boolean,
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
		let idx = this.subscribers.findIndex(item => {return item.subscribers.equals(user_id)})
		if (idx >= 0){
			this.subscribers[idx].count += 1
		} else {
			this.subscribers.push({subscriber:user_id,count:1})
		}
		resolve(this)
	})
}
movieSchema.methods.setCollected = function(){
	if (!this.file.added) this.file.added = new Date()
	return this
}

movieSchema.methods.subscribe = function(user_id){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user_id)
	})
	if (idx === -1){this.subscribers.push({subscriber:user_id})}
	return this
}
movieSchema.methods.unsubscribe = function(user_id){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user_id)
	})
	if (idx >= 0){this.subscribers.splice(idx,1)}
	return this
}

movieSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})
module.exports = mongoose.model('Movie', movieSchema)