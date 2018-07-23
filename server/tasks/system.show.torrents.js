"use strict"

// Check for completed torrents every 5 minutes

const helpers = require('nodetv-helpers')

const Show = helpers.model('show')

require('node-schedule').scheduleJob('*/5 * * * *', ()=>{
	console.debug('Shows: Checking for completed downloads')
	
	helpers.torrents.getComplete()
		.each(torrent=>{
			Show.findByHashString(torrent.hashString)
				.then(show=>{
					if (!show) return null
					
					// Hash may match multiple episodes
					
					let idx = show.episodes.findIndex(item=>{
						return item.file.download.hashString && item.file.download.hashString.toUpperCase() == torrent.hashString.toUpperCase()
					})
					let episode  = show.episodes[idx]
					
					if (!episode.file.download.active) return null
					
					let files = torrent.files.filter(item=>{
						return item.name.match(/\.(?:mkv|mp4|m4v)$/i)
					})
					
					let directory = show.getDirectory()
					
					return episode.getFilename(files[0].name, torrent.hashString).then(filename=>{
						if (!directory) throw new Error(`${show.title}: Directory not defined`)
						
						let source = require('path').join(torrent.downloadDir, files[0].name)
						let target = require('path').join(directory, filename)
						
						return helpers.files.copy(source, target, show.config.transcode, episode)
							.then(()=>{
								// TO DO: Mark collected if multi-episode file
								return episode.setCollected(filename, torrent.doneDate)
							})
							.then(()=>{
								console.debug(`Downloaded - ${show.title}: ${filename}`)
								return show.save()
							})
							.catch(error=>{
								if (error) console.error(error.message)
							})
					})
				})
				.finally(()=>{
					// Check seed ratio, if >= limit, remove torrent
					if (torrent.uploadLimit >= torrent.seedRatioLimit || torrent.isFinished){
						helpers.torrents.delete(torrent.id)
					}
				})
				.catch(error=>{
					if (error) console.error(error.message)
				})
		})
		.catch(error=>{
			if (error) console.error(error.message)
		})
})