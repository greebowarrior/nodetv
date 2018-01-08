"use strict"

// Refresh movie feed data
// Runs at 18 past the hour

const helpers = require('nodetv-helpers')
const Movie = helpers.model('movie')

require('node-schedule').scheduleJob('18 * * * *', ()=>{
	console.debug('Updating from YTS feeds')
	
	Movie.updateLatest()
		.catch(error=>{
			if (error) console.error(error.message)
		})
})
