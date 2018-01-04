"use strict"

// Refresh movie feed data
// Runs at 20 past the hour

const helpers = require('nodetv-helpers')
const Movie = helpers.model('movie')

require('node-schedule').scheduleJob('20 * * * *', ()=>{
	console.debug('Updating from YTS feeds')
	/*
	Movie.updateLatest()
		.each(movie=>{
			if (!movie) return
			movie.getInfoHash()
				.then(hash=>{
					return new Promise((resolve,reject)=>{
						if (!this.file.download.hashString){
							return resolve(hash)
						} else {
							if (this.file.download.hashString.toUpperCase() == hash.btih.toUpperCase()){
								return reject()
							} else {
								helpers.torrents.findByHash(this.file.download.hashString)
									.then(torrent=>{
										return helpers.torrents.delete(torrent.id)
									})
									.finally(()=>{
										resolve(hash)
									})
									.catch(error=>{
										if (error) console.error(error.message)
									})
							}
						}
					})
				})
				.then(hash=>{
					return helpers.torrents.createMagnet(hash.btih)
				})
				.then(magnet=>helpers.torrents.add(magnet))
				.then(hash=>movie.setDownloading(hash))
				.then(()=>{
					return movie.save({new:true})
				})
				.catch(error=>{
					if (error) console.error(`${this.title}: ${error.message}`)
				})
		})
		.catch(error=>{
			if (error) console.error(`${this.title}: ${error.message}`)
		})
	*/
})
