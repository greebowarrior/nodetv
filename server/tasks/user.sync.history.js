"use strict"

// Sync user watch history

// Is this causing CPU spikes and the non-responsiveness?
// limit to changes in the past 60 mins

const helpers = require('nodetv-helpers')

const User = helpers.model('user')
const Show = helpers.model('show')

require('node-schedule').scheduleJob('0,30 * * * *', function(){	
	console.debug('Syncing watch history with Trakt.tv')
	
//	let since = new Date()
//	since.setDays(since.getDays()-14)
	
	User.find({trakt:{$exists:true}})
		.then(users=>{
			if (!users) throw new Error('No users are connected to Trakt.tv')
			
			users.forEach(user=>{
				helpers.trakt(user).sync.history.get({type:'shows'}) //,start_at:since})
					.then(history=>{
						history.forEach(item=>{
							if (item.episode){
								Show.findByTrakt(item.show.ids.trakt)
									.then(show=>{
										return show.getEpisode(item.episode.season, item.episode.number)
											.then(episode=>{
												return episode.setWatched(user, item.watched_at, item.id)
											})
											.then(()=>{
												return show.save()
											})
									})
									.catch(error=>{
										console.debug(error)
									})
							}
						})
					})
					.catch(error=>{
						console.debug(error)
					})
			})
		})
		.catch(error=>{
			console.debug(error.message)
		})
})