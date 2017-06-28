"use strict"

const bcrypt = require('bcrypt-nodejs')
const mongoose = require('mongoose')

const helpers = require('nodetv-helpers')
const userSchema = new mongoose.Schema({
	username: {type: String, required: true, trim: true},
	password: {type: String, required: true},
	email: {type: String, lowercase: true, trim: true},
	tokens: [{
		_id: false,
		created: {type: Date, default: new Date()},
		token: String
	}],
	trakt: {
		access_token: String,
		expires: Date,
		refresh_token: String
	},
	profile: mongoose.Schema.Types.Mixed,
	added: {type: Date, default: new Date()},
	synced: Date,
	updated: {type: Date, default: new Date()}
})

userSchema.statics.findByToken = function(username,token){
	return this.findOne({
		'username': username, 'tokens.token': token
	})
}
userSchema.statics.findByUsername = function(username){
	return this.findOne({
		'username': username
	})
}

userSchema.methods.apiToken = function(){
	if (!this.tokens.length){
		let token = {
			token: require('uuid').v4(),
			created: new Date()
		}
		this.tokens.push(token)
	}
	return this.tokens[this.tokens.length-1].token
}
userSchema.methods.generateHash = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8))
}
userSchema.methods.verifyPassword = function(password){
	try {
		return bcrypt.compareSync(password, this.password)
	} catch(e){
		console.error(e)
		return false
	}
}
userSchema.methods.refreshToken = function(){
	if (this.trakt.expires <= new Date()){
		// refresh the access_token
	}
	return
}

userSchema.methods.sync = function(){
	// TODO: get WHOLE collection and return
	return helpers.trakt(this).sync.collection.get({type:'shows'})
		.then(results=>{
			let promise = []
			results.forEach(result=>{
				promise.push(result)
			})
			return Promise.all(promise)
		})
}

userSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})
userSchema.pre('remove', function(next){
	// Remove user from shows
	const Show = require('./show')
	
	Show.findByUser(this._id)
		.then(shows=>{
			let promises = []
			
			shows.forEach(show=>{
				let promise = show.unsubscribe(this).save()
				promises.push(promise)
			})
			
			Promise.all(promises)
				.then(()=>{
					if (typeof next === 'function') next()
				})
		})
})

userSchema.post('findOne', function(doc,next){
	//doc.uri = `/api/users/${doc._id}`
	next()
})

module.exports = mongoose.model('User', userSchema)
