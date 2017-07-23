"use strict"

// Sync user watch history

const helpers = require('nodetv-helpers')

const User = helpers.model('user')
const Show = helpers.model('show')

require('node-schedule').scheduleJob('0,30 * * * *', function(){	
	console.debug('Syncing watch history with Trakt.tv')
	
	let since = new Date()
	since.setDate(since.getDate()-7)
	
	User.find({trakt:{$exists:true}}).exec()
		.map(user=>{
			helpers.trakt(user).sync.history.get({type:'shows', start_at:since})
				.then(watches=>{
					let history = []
					
					watches.forEach(item=>{
						if (item.episode){
							let idx = history.findIndex(show=>{
								return show.trakt == item.show.ids.trakt
							})
							if (idx >= 0){
								history[idx].history.push(item)
							} else {
								history.push({
									show: item.show.title,
									trakt: item.show.ids.trakt,
									history: [item]
								})
							}
						}
					})
					
					history.forEach(item=>{
						Show.findByTrakt(item.trakt)
							.then(show=>{
								if (!show) return
								item.history.forEach(watch=>{
									show.getEpisode(watch.episode.season, watch.episode.number)
										.then(episode=>{
											return episode.setWatched(user, watch.watched_at, watch.id)
										})
								})
								return show.save()
							})
					})
				})
				.catch(error=>{
					console.debug(error)
				})
		})
		.catch(error=>{
			console.debug(error.message)
		})
})
