"use strict"

const bcrypt = require('bcrypt-nodejs')
const mongoose = require('mongoose')

const helpers = require('nodetv-helpers')

const Movie = require('./movie')
const Show = require('./show')

const userSchema = new mongoose.Schema({
	username: {type:String, required:true, lowercase:true, trim:true, unique:true},
	password: {type:String, required: true},
	email: {type:String, lowercase:true, trim:true, unique:true},
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
userSchema.methods.setPassword = function(password,passconf){
	if (password && passconf && password === passconf){
		this.password = this.generateHash(password)
	}
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

userSchema.methods.syncCollection = function(){
	return helpers.trakt(this).sync.collection.get({type:'shows'})
		.then(results=>{
			if (!results) throw new Error(`No shows in Trakt collection`)
			
			let promises = []
			results.forEach(result=>{
				if (result.movie){
					let promise = Movie.findBySlug(result.movie.ids.slug)
						.then(movie=>{
							if (!movie) movie = new Movie(result.movie)
							return movie.subscribe(this).save({new:true})
						})
						.then(movie=>{
							return movie.sync()
						})
						.then(movie=>{
							return movie.save()
						})
					promises.push(promise)
				}
				if (result.show){
					let promise = Show.findBySlug(result.show.ids.slug)
						.then(show=>{
							if (!show) show = new Show(result.show)
							return show.subscribe(this).save({new:true})
						})
						.then(show=>{
							return show.sync()
						})
						.then(show=>{
							return show.save()
						})
					promises.push(promise)
				}
			})
			
			return Promise.all(promises)
		})
}

userSchema.pre('save', function(next){
	this.updated = new Date()
	next()
})
userSchema.pre('remove', function(next){
	// Remove user from shows
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
