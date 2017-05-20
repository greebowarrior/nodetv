"use strict"

const mongoose = require('mongoose')

const seasonSchema = new mongoose.Schema({
	ids: {
		imdb: String,
		tmdb: Number,
		trakt: Number,
		tvdb: Number
	},
	season: {type: Number, required: true},
	title: String,
	overview: String,
	episodes: [],
	first_aired: Date,
	updated_at: {type: Date, default: null}
})

seasonSchema.methods.getEpisodes = function(){
	return new Promise(resolve=>{
		let episodes = this.parent().episodes.filter(item=>{
			return item.season == this.season
		})
		episodes.sort((a,b)=>{
			if (a.episode > b.episode) return 1
			if (a.episode < b.episode) return -1
			return 0
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
seasonSchema.methods.setWatched = function(user){
	new Promise(resolve=>{
		let episodes = this.parent().episodes.filter(item=>{
			return item.season == this.season
		})
		episodes.forEach(episode=>{
			episode.setWatched(user)
		})
		resolve(this)
	})
}

module.exports = seasonSchema
