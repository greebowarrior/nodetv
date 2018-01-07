"use strict"

// Update enabled shows and fetch episode data

const helpers = require('nodetv-helpers')
const Show = helpers.model('show')
const User = helpers.model('user')

// Run nightly at 1am
require('node-schedule').scheduleJob('0 1 * * *', ()=>{
	console.debug(`Syncing show data from Trakt`)

	Promise.try(()=>{
		return User.findOne({trakt:{$exists:true}})
	}).then(user=>{
		Show.findEnabled()
			.each(show=>{
				console.debug(`Syncing ${show.title}`)
				
				show.sync(user).then(()=>{
					return show.save()
				}).catch(error=>{
					if (error) console.error(error.message)
				})
				return null
			})
			.catch(error=>{
				if (error) console.error(error.message)
			})
	})
})