"use strict"

const helpers = require('nodetv-helpers')
const User = helpers.model('user')

// Sync user collection

require('node-schedule').scheduleJob('30 0 * * *', ()=>{
	User.find({trakt:{$exists:true}}).exec()
		.each(user=>{
			user.syncCollection('shows')
				.then(results=>{
					console.debug(`%s : %d shows synced from collection`, user.username, results.length)
				})
				.catch(error=>{
					if (error) console.error(error.message)
				})
			return null
		})
		.catch(error=>{
			if (error) console.error(error.message)
		})
})