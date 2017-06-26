"use strict"

const helpers = require('nodetv-helpers')

const Show = helpers.model('show')

// Run nightly at 1am

require('node-schedule').scheduleJob('0 1 * * *', ()=>{
	console.debug(`Syncing show data from Trakt`)
	Show.findEnabled()
		.then(shows=>{
			if (!shows.length) throw new Error(`No shows enabled`)
			shows.forEach(show=>{
				console.debug(`Syncing ${show.title}`)
				show.sync().then(()=>{
					show.save()
				})
			})
		})
		.catch(error=>{
			console.error(error.message)
		})
})
