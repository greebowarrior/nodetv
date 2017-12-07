"use strict"

const helpers = require('nodetv-helpers')
const router = require('express').Router()

const Show = helpers.model('show')
const Socket = helpers.model('socket')

const ShowsAPI = (app,io)=>{
	console.debug('API loaded: Shows')
	app.use('/shows', router)
		
	router.route('/')
		.get((req,res)=>{
			Show.findByUser(req.user, {episodes:false,seasons:false},{sort:{title:1}})
				.then(shows=>{
					shows.sort((a,b)=>a.title.toLowerCase().localeCompare(b.title.toLowerCase()))
					res.send(shows)
				})
				.catch(error=>{
					console.error(error)
					res.status(404).send({error:error})
				})
		})
		.post((req,res)=>{
			Show.findBySlug(req.body.slug)
				.then(show=>{
					if (show) return show
					
					show = new Show({ids:{slug:req.body.slug}})
					return show.sync(req.user)
				})
				.then(show=>{
					// Subscribe to show
					return show.subscribe(req.user).save()
				})
				.then(show=>{
					return show.save()
				})
				.then(show=>{
					res.status(201).send(show)
				})
				.catch(error=>{
					console.error(error)
					res.status(400).send({error:error})
				})
		})

	router.route('/latest')
		.get((req,res)=>{
			Show.recentEpisodes(req.user)
				.then(shows=>{
					let results = []
					shows.forEach(show=>{
						if (!show.episodes.length) return
						show.episodes.sort((a,b)=>{
							if (a.episode > b.episode) return 1
							if (a.episode < b.episode) return -1
							return 0
						})
						show.episodes.forEach(episode=>{
							episode.watchers = episode.watchers.filter(watcher=>{
								return watcher.watcher.equals(req.user._id)
							})
						})
						results.push(show)
					})
					res.send(results)
				})
				.catch(error=>{
					console.error(error)
					res.status(404).send({error:error})
				})
		})
	router.route('/upcoming')
		.get((req,res)=>{
			Show.upcomingEpisodes(req.user)
				.then(shows=>{
					let results = []
					shows.forEach(show=>{
						if (show.episodes.length) results.push(show)
					})
					res.send(results)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
	
	router.route('/ondeck')
		.get((req,res)=>{
			helpers.trakt(req.user).ondeck.getAll()
				.then(deck=>{
					res.send(deck)
				})
				.catch(error=>{
					console.error(error)
					res.status(400).end()
				})
		})
	
	// Show
	router.route('/:slug')
		.delete((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					return show.unsubscribe(req.user).save({new:true})
				})
				.then(()=>{
					res.status(204).end()
				})
				.catch(error=>{
					console.error(error)
					res.status(400).send({error:error})
				})
		})
		.get((req,res)=>{
			Show.findBySlug(req.params.slug,{episodes:false})
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					res.send(show)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
		.patch((req,res)=>{
			
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					Object.assign(show.config, req.body.config)
					return show.save()
				})
				.then(show=>{
					res.send(show.config)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					Object.assign(show, req.body)
					return show.save()
				})
				.then(show=>{
					res.send(show)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
	
	router.route('/:slug/artwork')
		.get((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					return helpers.trakt().images.get(show.ids)
				})
				.then(images=>{
					res.send(images)
				})
		})
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					return show.setArtwork(req.body).then(()=>show.save())
				})
				.then(()=>{
					res.send({success:true})
				})
				.catch(error=>{
					console.error(error)
					res.status(404).end()
				})
		})
	
	router.route('/:slug/feeds')
		.patch((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					return show.parseFeed()
				})
				.catch(error=>{
					console.error(error)
				})
			res.status(202).end()
		})
	
	router.route('/:slug/match')
		.get((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					return show.match()
				})
				.then(directory=>{
					res.send({directory:directory})
				})
				.catch(()=>{
					res.status(304).end()
				})
		})
	
	router.route('/:slug/scan')
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					
					io.sockets.emit('notify', {type:'info',msg:`Rescan started: '${show.title}'`})
					
					show.scan().then(()=>{
						io.sockets.emit('notify', {type:'info',msg:`Rescan complete: '${show.title}'`})
					})
					.catch(()=>{
						io.sockets.emit('notify', {type:'danger',msg:`Rescan failed: '${show.title}'`})
					})
					res.status(202).send({message: 'In Progress'})
				})
				.catch(error=>{
					console.error(error)
					res.status(400).send(error)
				})
		})

	router.route('/:slug/sync')
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					
					res.status(202).status({message: 'Accepted'})
					console.debug('Syncing show: %s', show.title)
					return show.sync()
						.then(()=>{
							return show.save({new:true})
						})
				})
				.then(show=>{
					return Socket.findByUser(req.user)
						.then(sockets=>{
							sockets.forEach(socket=>{
								io.to(socket.id).emit('alert', {
									title: show.title,
									type: 'success',
									msg: 'Show data updated'
								})
							})
						})
				})
				.catch(error=>{
					console.error(error)
					res.status(404).send({error: 'Not Found'})
				})
		})

	
	router.route('/:slug/seasons')
		.get((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					show.seasons.sort((a,b)=>{
						if (a.season > b.season) return 1
						if (a.season < b.season) return -1
						return 0
					})
					res.send(show.seasons)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
		
	router.route('/:slug/seasons/:season')
		.get((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					let season = show.seasons.filter(item=>{
						return item.season == parseInt(req.params.season,10)
					})
					
					season[0].getEpisodes()
						.then(episodes=>{
							episodes.forEach(episode=>{
								episode.watchers = episode.watchers.filter(watcher=>{
									return watcher.watcher.equals(req.user._id)
								})
							})
							season[0].episodes = episodes
							res.send(season.length ? season[0] : {})
						})
					
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
	
	router.route('/:slug/seasons/:season/episodes')
		.get((req,res)=>{
			// Return episodes for this season
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					let episodes = show.episodes.filter(item=>{
						return item.season == req.params.season
					})
					
					episodes.sort((a,b)=>{
						if (a.episode > b.episode) return 1
						if (a.episode < b.episode) return -1
						return 0
					})
					
					episodes.forEach(episode=>{
						episode.watchers = episode.watchers.filter(watcher=>{
							return watcher.watcher.equals(req.user._id)
						})
					})
					res.send(episodes)
				})
				.catch(error=>{
					console.debug(error.message)
					res.status(404).send({error:error})
				})
		})
	
	router.route('/:slug/seasons/:season/episodes/:episode')
		.get((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					return show.getEpisode(req.params.season, req.params.episode)
						.then(episode=>{
							episode.watchers = episode.watchers.filter(item=>{
								return item.watcher.equals(req.user._id)
							})
							res.send(episode)
						})
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
	
	
	// SHOW - WATCHED
	router.route('/:slug/watched')
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					
					show.setWatched(req.user)
						.then(()=>{
							return show.save()
						})
						.then(()=>{
							res.send(show)
						})
				})
		})
	
	router.route('/:slug/seasons/:season/watched')
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					let idx = show.seasons.findIndex(item=>{
						return item.season == req.params.season
					})
					if (idx){
						show.seasons[idx].setWatched(req.user)
							.then(()=>{
								return show.save()
							})
							.then(()=>{
								res.send(show.seasons[idx])
							})
							.catch(error=>{
								res.status(400).send({error:error.message})
							})
					}
				})
		})
	
	router.route('/:slug/seasons/:season/episodes/:episode/watched')
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					
					return show.getEpisode(req.params.season,req.params.episode)
						.then(episode=>{
							return episode.setWatched(req.user)
						})
						.then(()=>{
							return show.save()
						})
						.then(()=>{
							res.send({status:true})
						})
				})
				.catch(error=>{
					console.error(error)
					res.status(404).end()
				})
		})
	
	// SHOW - DOWNLOAD
	router.route('/:slug/seasons/:season/episodes/:episode/download')
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					
					return show.getEpisode(req.params.season, req.params.episode)
						.then(episode=>{
							if (req.body.hash){
								// Download a specific torrent
								
								return new Promise((resolve,reject)=>{
									let idx = episode.hashes.findIndex(hash=>{
										return hash.btih === req.body.hash
									})
									if (idx >= 0){
										resolve(episode.hashes[idx])
									} else {
										reject()
									}
								})
								.then(hash=>{
									return helpers.torrents.createMagnet(hash.btih)
								})
								.then(magnet=>{
									return helpers.torrents.add(magnet)
								})
								.then(hash=>{
									return episode.setDownloading(hash)
								})
							} else {
								// Find torrent by standard method
								return episode.getMagnet()
									.then(magnet=>{
										return helpers.torrents.add(magnet)
									})
									.then(hash=>{
										return episode.setDownloading(hash)
									})
							}
						})
						.then(()=>{
							return show.save()
						})
				})
				.then(()=>{
					res.send({success:true})
				})
				.catch(error=>{
					console.error(error)
					res.status(400).end()
				})
		})
	
	router.route('/:slug/seasons/:season/episodes/:episode/play')
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					return show.getEpisode(req.params.season, req.params.episode)
				})
				.then(episode=>{
					if (!episode) throw new Error(`Episode not found`)
					
					return episode.play(req.user, req.body.device.url)
					
				//	return helpers.upnp.setDevice(req.body.device.url).then(()=>{
				//		return helpers.upnp.load(episode)
				//	})
				})
				.then(()=>{
					res.status(200).end()
				})
				.catch(error=>{
					if (error) console.error(error)
					res.status(400).end()
				})
		})
	
	// SHOW - COLLECTED ??
	
	// should this have an endpoint?
	
	/*
	router.route('/:slug/collected')
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					return req.trakt.sync.collection.add({
						shows:[{
							ids: show.ids
						}]
					})
					.then(()=>{
						return show.setCollected()
					})
					.this(()=>{
						return show.save()
					})
				})
				.then(show=>{
					res.send(show)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
		
	router.route('/:slug/download')
		.post((req,res)=>{
			// download all episodes
			Show.findBySlug(req.params.slug)
				.then(show=>{
					show.seasons.forEach(season=>{
						season.episode.forEach(episode=>{
							if (!episode.hashes) return
							helpers.torrent.add(episode.hashes, show.config.hd)
						})
					})
					return
				})
				.then(()=>{
					res.status(202).end()
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
	
	router.route('/:slug/feed')
		.get((req,res)=>{
			helpers.shows.parseFeed(req.params.slug)
				.then(show=>{
					res.send(show)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		}) // Updated
	*/
	
}
module.exports = ShowsAPI