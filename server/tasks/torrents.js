"use strict"

const helpers = require('nodetv-helpers')

const Show = helpers.model('show')

require('node-schedule').scheduleJob('*/5 * * * *', ()=>{
	console.debug('Checking for completed downloads')
	
	helpers.torrents.getComplete()
		.then(torrents=>{
			torrents.forEach(torrent=>{
				Show.findByHashString(torrent.hashString)
					.then(show=>{
						if (!show) return null
						
						let idx = show.episodes.findIndex(item=>{
							return item.file.download.hashString == torrent.hashString
						})
						let episode  = show.episodes[idx]
						
						if (!episode.file.download.active) return null
						
						let files = torrent.files.filter(item=>{
							return item.name.match(/\.(?:mkv|mp4|m4v)$/i)
						})
						
						let directory = show.getDirectory()
						let filename = episode.getFilename()
						
						if (!directory) throw new Error(`${show.title}: Directory not defined`)
						
						let source = require('path').join(torrent.downloadDir, files[0].name)
						let target = require('path').join(directory, filename)
						
						return helpers.files.copy(source, target, show.config.transcode)
							.then(()=>{
								return episode.setCollected(filename)
							})
							.then(()=>{
								return show.save()
							})
					})
					.then(()=>{
						// Check seed ratio, if >= limit, remove torrent
						if (torrent.uploadLimit >= torrent.seedRatioLimit || torrent.isFinished){
							helpers.torrents.delete(torrent.id)
						}
					})
					.catch(error=>{
						if (error) console.error(error.message)
					})
			})
		//	return Promise.all(promises)
		})
		.catch(error=>{
			console.error(error)
		})
})