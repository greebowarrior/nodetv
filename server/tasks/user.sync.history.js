"use strict"

// Sync user watch history

const helpers = require('nodetv-helpers')

const User = helpers.model('user')
const Show = helpers.model('show')

require('node-schedule').scheduleJob('0,30 * * * *', function(){	
	console.debug('Syncing watch history with Trakt.tv')
	
	User.find({trakt:{$exists:true}})
		.then(users=>{
			if (!users) throw new Error('No users are connected to Trakt.tv')
			
			users.forEach(user=>{
				Show.findByUser(user._id)
					.then(shows=>{
						shows.forEach(show=>show.syncHistory(user))
					})
					.catch(error=>{
						console.debug(error)
					})
			})
		})
		.catch(error=>{
			console.debug(error)
		})
})