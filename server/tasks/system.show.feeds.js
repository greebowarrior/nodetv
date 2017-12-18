"use strict"

// Refresh show feed data
// Runs at 10 past the hour

const helpers = require('nodetv-helpers')
const Show = helpers.model('show')

require('node-schedule').scheduleJob('10 * * * *', ()=>{
	console.debug('Updating from RSS feeds')
	
	Show.findEnabled()
		.then(shows=>{
			
			shows.forEach((show,idx)=>{
				if (!show.subscribers.length){
					// Disable shows with no subscribers
					show.config.enabled = false
					// TODO: Disable ended/cancelled shows
					return show.save()
				}
				
				show.hasRecentEpisodes()
					.then(results=>{
						if (!results.length) throw new Error(`No recently aired episodes`)
						setTimeout(()=>{
							return show.parseFeed()
						},idx*200)
					})
					.then(()=>show.getLatestEpisodes())
					.map(result=>{
						if (!result) throw new Error(`No recently available episodes`)
						
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
								if (hash){
									console.debug(`Starting Download: ${show.title} - ${episode.title}`)
									return helpers.torrents.createMagnet(hash.btih)
								}
							})
							.then(magnet=>helpers.torrents.add(magnet))
							.then(hash=>episode.setDownloading(hash))
					})
					.then(()=>{
						return show.save()
					})
					.catch(error=>{
						if (error) console.info(`${show.title}: `, error.message)
					})
			})
		})
		.catch(error=>{
			if (error) console.error(error.message)
		})
})
