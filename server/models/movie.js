"use strict"

const helpers = require('nodetv-helpers')
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
	subscribers: [{
		_id: false,
		rating: Number,
		subscriber: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
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
		directory: String,
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


movieSchema.methods.getDirectory = function(){
	if (this.config.directory){
		return require('path').join(
			process.env.MEDIA_ROOT,
			process.env.MEDIA_MOVIES,
			helpers.utils.normalize(this.file.directory)
		)
	}
	return false
}

movieSchema.methods.subscribe = function(user){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user._id)
	})
	if (idx === -1) this.subscribers.push({subscriber:user._id})
	helpers.trakt(user).sync.watchlist.add({movies:[{ids:{trakt:this.ids.trakt}}]})
	return this
}
movieSchema.methods.unsubscribe = function(user){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user._id)
	})
	if (idx >= 0) this.subscribers.splice(idx,1)
	helpers.trakt(user).sync.watchlist.remove({movies:[{ids:{trakt:this.ids.trakt}}]})	
	return this
}

movieSchema.methods.setWatched = function(user){
	return new Promise(resolve=>{
		let idx = this.watchers.findIndex(item=>item.watchers.equals(user._id))
		
		if (idx >= 0){
			this.watchers[idx].watches.push({date: new Date()})
		} else {
			this.watchers.push({watcher:user._id,watches:{date: new Date()}})
		}
		
		resolve(this)
	})
}
movieSchema.methods.setCollected = function(){
	if (!this.file.added) this.file.added = new Date()
	return this
}

movieSchema.methods.sync = function(user={}){
	return helpers.trakt(user).movies.summary({id:this.ids.slug, extended:'full'})
		.then(summary=>{
			if (!this.synced || this.synced < new Date(summary.updated_at)){
				this.ids = Object.assign({}, this.ids, summary.ids)
				this.overview = summary.overview
				this.year = summary.year
				this.synced = new Date(summary.updated_at)
				this.title = summary.title
			}
			return this
		})
}

movieSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})
module.exports = mongoose.model('Movie', movieSchema)