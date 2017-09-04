"use strict"

// Refresh show feed data
// Runs at 10 past the hour

const helpers = require('nodetv-helpers')
const Show = helpers.model('show')

require('node-schedule').scheduleJob('10 * * * *', ()=>{
	console.debug('Updating from RSS feeds')
	
	Show.findEnabled()
		.then(shows=>{
			shows.forEach(show=>{
				if (!show.subscribers.length){
					// Disable shows with no subscribers
					show.config.enabled = false
					return show.save()
				}
				
				return show.parseFeed()
					.then(()=>show.getLatestEpisodes())
					/*
					.then(results=>{
						let promises = []
						
						results.forEach(result=>{
							let episode = show.episodes.id(result._id)
							
							// Don't get latest episode if it's already downloading or downloaded
							if (episode.file.download.active || episode.file.added) return
							// Get magnet for preferred format
							let process = episode.getMagnet()
								// Send to transmission
								.then(magnet=>helpers.torrents.add(magnet))
								// Mark episode as downloading
								.then(hash=>episode.setDownloading(hash))
							
							promises.push(process)
						})
						return Promise.all(promises)
					})
					*/
					.map(result=>{
						let episode = show.episodes.id(result._id)
						
						return episode.getInfoHash()
							.then(hash=>{
								return new Promise((resolve,reject)=>{
									if (!episode.file.download.active) return resolve(hash)
									
									if (episode.file.download.hashString.toUpperCase() != hash.btih.toUpperCase()){
										// Remove the current download (if it's still active)
										helpers.torrents.findByHash(episode.file.download.hashString)
											.then(torrent=>{
												return helpers.torrents.delete(torrent.id)
											})
											.catch(error=>{
												console.debug(error.message)
											})
										resolve(hash)
									}
									reject()
								})
							})
							.then(hash=>{
								return helpers.torrents.createMagnet(hash.btih)
							})
							.then(magnet=>helpers.torrents.add(magnet))
							.then(hash=>episode.setDownloading(hash))
					})
					.then(()=>{
						return show.save()
					})
					.catch(error=>{
						console.error(`${show.title}: `, error.message)
					})
			})
		})
		.catch(error=>{
			if (error) console.error(error.message)
		})
})
