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
		download: {
			active: Boolean,
			hashString: String
		},
		filename: String,
		filesize: Number,
		hash: String,
		quality: {type: String, enum: ['SD','720p','1080p']}
	},
	images: {
		background: {
			enabled: {type: Boolean, default: false},
			files: [{
				_id: false,
				width: String,
				filename: String
			}],
			source: String
		},
		banner: {
			enabled: {type: Boolean, default: false},
			files: [{
				_id: false,
				width: String,
				filename: String
			}],
			source: String
		},
		poster: {
			enabled: {type: Boolean, default: false},
			files: [{
				_id: false,
				width: String,
				filename: String
			}],
			source: String
		}
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
movieSchema.statics.findByUser = function(user){
	return this.find({
		'subscribers.subscriber': mongoose.Types.ObjectId(user._id)
	})
}

movieSchema.methods.subscribe = function(user){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user._id)
	})
	if (idx === -1){
		this.subscribers.push({subscriber:user._id})
		helpers.trakt(user).sync.watchlist.add({movies:[{ids:{trakt:this.ids.trakt}}]})
	}
	return this
}
movieSchema.methods.unsubscribe = function(user){
	let idx = this.subscribers.findIndex(item=>{
		return item.subscriber.equals(user._id)
	})
	if (idx >= 0) this.subscribers.splice(idx,1)
	helpers.trakt(user).sync.watchlist.remove({movies:[{ids:{trakt:this.ids.trakt}}]})
	helpers.trakt(user).sync.collection.remove({movies:[{ids:{trakt:this.ids.trakt}}]})
	return this
}

movieSchema.methods.setWatched = function(user, date=null, id=null){
	if (!date) date = new Date()
	
	return new Promise(resolve=>{
		let idx = this.subscribers.findIndex(item=>{
			return item.subscriber.equals(user._id)
		})
		if (idx >= 0){
			let checkin = this.subscribers[idx].watches.findIndex(item=>{
				return item.id == id || item.date == new Date(date)
			})
			if (checkin >= 0){
				if (id) this.subscribers[idx].watches[checkin].id = id
			} else {
				this.subscribers[idx].watches.push({date:date,id:id})
			}
			resolve(id)
		} else {
			this.subscribers.push({
				subscriber: user._id,
				watches: [{date:date,id:id}]
			})
			resolve(id)
		}
	})
	.then(id=>{
		if (!id){
			helpers.trakt(user).sync.history.add({
				movies: [{ids:{trakt:this.ids.trakt},watched_at:date}]
			})
		}
		return this
	})
}
movieSchema.methods.setCollected = function(file=null){
	return this.subscribers.forEach(user=>{
		helpers.trakt(user).sync.collection.add({movies:[{ids:{trakt:this.ids.trakt}}]})
	})
	.finally(()=>{
		if (file) this.file.filename = file
		this.file.added = new Date()
		this.file.download.active = undefined
		
		return this
	})
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
movieSchema.methods.syncHistory = function(user={}){
	console.log(`${this.title}: Syncing watch history for ${user.username}`)
	
	return helpers.trakt(user).sync.history.get({type:'movies', id:this.ids.trakt})
		.then(history=>{
			if (!history) return
			history.forEach(watch=>{
				this.setWatched(user, new Date(watch.watched_at), watch.id)
			})
			return this.save({new:true})
		})
		.catch(error=>{
			console.debug(error)
		})
}

movieSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})
module.exports = mongoose.model('Movie', movieSchema)