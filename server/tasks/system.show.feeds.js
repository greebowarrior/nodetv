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
					.map(result=>{
						let episode = show.episodes.id(result._id)
						
						return episode.getInfoHash()
							.then(hash=>{
								return new Promise((resolve,reject)=>{
									if (!episode.file.download.hashString){
										return resolve(hash)
									} else {
										if (episode.file.download.hashString.toUpperCase() == hash.btih.toUpperCase()){
											return reject()
										} else {
											helpers.torrents.findByHash(episode.file.download.hashString)
												.then(torrent=>{
													return helpers.torrents.delete(torrent.id)
												})
												.finally(()=>{
													resolve(hash)
												})
												.catch(error=>{
													if (error) console.debug(error.message)
												})
										}
									}
								})
							})
							.then(hash=>{
								console.debug(`Starting Download: ${show.title} - ${episode.title}`)
								return helpers.torrents.createMagnet(hash.btih)
							})
							.then(magnet=>helpers.torrents.add(magnet))
							.then(hash=>episode.setDownloading(hash))
					})
					.then(()=>{
						return show.save()
					})
					.catch(error=>{
						if (error) console.error(`${show.title}: `, error.message)
					})
			})
		})
		.catch(error=>{
			if (error) console.error(error.message)
		})
})
