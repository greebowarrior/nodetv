"use strict"

// Check for completed movie torrents every 10 minutes

const helpers = require('nodetv-helpers')

const Movie = helpers.model('movie')

require('node-schedule').scheduleJob('*/10 * * * *', ()=>{
	console.debug('Movies: Checking for completed downloads')
	
	helpers.torrents.getComplete()
		.each(torrent=>{
			Movie.findByHashString(torrent.hashString)
				.then(movie=>{
					if (!movie || !movie.file.download.active) return null
					
					let files = torrent.files.filter(item=>{
						return item.name.match(/\.(?:mkv|mp4|m4v)$/i)
					})
					
					let directory = movie.getDirectory()
					let filename = movie.getFilename(files[0].name, torrent.hashString)
					
					if (!directory) throw new Error(`${movie.title}: Directory not defined`)
					
					let source = require('path').join(torrent.downloadDir, files[0].name)
					let target = require('path').join(directory, filename)
					
					return helpers.files.copy(source, target, movie.config.transcode, movie)
						.then(()=>{
							return movie.setCollected(filename, torrent.doneDate)
						})
						.then(()=>{
							console.debug(`Downloaded: ${movie.title}`)
							return movie.save()
						})
						.catch(error=>{
							if (error) console.error(error.message)
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