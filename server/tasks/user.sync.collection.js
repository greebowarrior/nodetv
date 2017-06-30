"use strict"

const helpers = require('nodetv-helpers')

//const Show = helpers.model('show')
const User = helpers.model('user')

// Sync user collection

require('node-schedule').scheduleJob('30 0 * * *', ()=>{
	User.find({trakt:{$exists:true}})
		.then(users=>{
			if (!users) throw new Error(`No Trakt-enabled users`)
			
			users.forEach(user=>{
				user.syncCollection()
					.then(results=>{
						console.debug(`%s : %d shows synced from collection`, user.username, results.length)
					})
					.catch(error=>{
						console.error(error)
					})
			})
		})
		.catch(error=>{
			console.error(error)
		})
})