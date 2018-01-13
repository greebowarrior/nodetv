"use strict"

// Refresh movie feed data hourly at 18 mins past

const helpers = require('nodetv-helpers')
const Movie = helpers.model('movie')

require('node-schedule').scheduleJob('18 * * * *', ()=>{
	console.debug('Updating movies from YTS feeds')
	
	Movie.updateLatest()
		.then(()=>{
			return Movie.find({'ids.imdb':{$exists:true},$or:[{hashes:{$size:0}},{hashes:{$exists:false}}]})
		})
		.each(movie=>{
			return movie.parseFeed()
		})
		.catch(error=>{
			if (error) console.error(error.message)
		})
		
	
})

// Find feeds per movie nightly at 4:31am
require('node-schedule').scheduleJob('31 4 * * *', ()=>{
	console.debug('Updating movies from YTS feeds')
	
	Movie.find({'ids.imdb':{$exists:true},$or:[{hashes:{$size:0}},{hashes:{$exists:false}}]})
		.each((movie,idx)=>{
			setTimeout(()=>{
				return movie.parseFeed()
			},idx*250)
		})
		.catch(error=>{
			if (error) console.error(error.message)
		})
})
