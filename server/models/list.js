"use strict"

const helpers = require('nodetv-helpers')

const mongoose = require('mongoose')

const Movie = require('./movie')
const Show = require('./show')

const listSchema = new mongoose.Schema({
	name: {type:String, required:true},
	user: {type:mongoose.Schema.Types.ObjectId, ref:'User'},
	description: {type:String},
	ids: {
		slug: {type:String},
		trakt: {type:Number, unique:true}
	},
	items: [{
		type: {type:String, enum:['movie','show'], required:true},
		movie: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Movie'
		},
		show: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Show'
		},
		listed_at: {type:Date}
	}],
	added: {type: Date, default: new Date()},
	synced: Date,
	updated: {type: Date, default: new Date()}
},{
	toObject:{virtuals:true}, toJSON:{virtuals:true}
})

listSchema.statics.findByUser = function(user){
	return this.find({'user':user._id}).exec()
}
listSchema.statics.findByTrakt = function(trakt){
	return this.findOne({'ids.trakt':trakt}).exec()
}

listSchema.methods.addItem = function(type,ids){
	return Promise.try(()=>{
		if (type == 'movie'){
			return Movie.findByTrakt(ids.trakt)
		}
		if (type == 'show'){
			return Show.findByTrakt(ids.trakt)
		}
	}).then(result=>{
		let item = {type:type}
		item[type] = result._id
		this.items.push(item)
		
		return true
	})
}

listSchema.statics.syncLists = function(user={}){
	
	return helpers.trakt(user).users.lists.get({username:user.profile.username})
		.each(list=>{
			
			return this.findByTrakt(list.ids.trakt).then(playlist=>{
				if (!playlist) playlist = new this(list)
				
				Object.assign(playlist, list)
				
				playlist.user = user._id
				playlist.items = []
				
				return helpers.trakt(user).users.list.items.get({username:user.profile.username, id:list.ids.trakt})
					.each(item=>{
						// Find item, and add to list
						return Promise.try(()=>{
							if (item.type == 'movie'){
								return Movie.findByTrakt(item.movie.ids.trakt)
							}
							if (item.type == 'show'){
								return Show.findByTrakt(item.show.ids.trakt)
							}
						}).then(doc=>{
						//	if (!doc) return null
							let insert = {type:item.type}
							insert[item.type] = doc._id
							playlist.items.push(insert)
							return true
						})
					//	.finally(()=>{
					//		return true
					//	})
					})
					.then(()=>{
						console.log(playlist)
						return playlist.save({new:true})
					})
			})
			
			
		})
}

listSchema.virtual('uri').get(function(){
	return `/api/lists/${this.ids.trakt}`
})

listSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})

module.exports = mongoose.model('List', listSchema)