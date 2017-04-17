"use strict"

const mongoose = require('mongoose')

let seasonSchema = new mongoose.Schema({
	ids: {
		imdb: String,
		tmdb: Number,
		trakt: Number,
		tvdb: Number
	},
	season: {type: Number, required: true},
	title: String,
	overview: String,
	episodes: Number,
	first_aired: Date
})

seasonSchema.methods.getEpisodes = function(){
	return new Promise(resolve=>{
		let episodes = this.parent().episodes.filter(item=>{
			return item.season == this.season
		})
		resolve(episodes)
	})
}

seasonSchema.methods.setCollected = function(){
	return new Promise(resolve=>{
		let episodes = this.parent().episodes.filter(item=>{
			return item.season == this.season
		})
		episodes.forEach(episode=>{
			episode.setCollected()
		})
		this.parent().save()
		resolve(this)
	})
}
seasonSchema.methods.setWatched = function(){
	new Promise(resolve=>{
		let episodes = this.parent().episodes.filter(item=>{
			return item.season == this.season
		})
		episodes.forEach(episode=>{
			episode.setWatched()
		})
		resolve(this)
	})
}

module.exports = seasonSchema
