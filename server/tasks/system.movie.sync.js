"use strict"

// Update Movies metadata nightly

const helpers = require('nodetv-helpers')
const Movie = helpers.model('movie')
const User = helpers.model('user')

// Run nightly at 1:15am
require('node-schedule').scheduleJob('15 1 * * *', ()=>{
	console.debug(`Syncing movie data from Trakt`)
	
	Promise.try(()=>{
		return User.findOne({trakt:{$exists:true}})
	}).then(user=>{
		return Movie.find({overview:{$exists:false}}).exec()
			.each(movie=>{
				console.debug(`Syncing ${movie.title}`)
				
				movie.sync(user).then(()=>{
					return movie.save()
				}).catch(error=>{
					if (error) console.error(`${movie.title}: ${error.message}`)
				})
				return null
			})
			.catch(error=>{
				if (error) console.error(error.message)
			})
	})
})