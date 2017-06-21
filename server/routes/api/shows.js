"use strict"

const Show = require(require('path').join(process.env.MODELS,'show'))

const router = require('express').Router()
const helpers = require('nodetv-helpers')

const ShowsAPI = (app,io)=>{
	console.debug('API loaded: Shows')
	app.use('/api/shows', router)
		
	router.route('/')
		.get((req,res)=>{
			Show.findByUser(req.user._id, {episodes:false,seasons:false},{sort:{title:1}})
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
					return show.subscribe(req.user._id).save()
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
			Show.recentEpisodes()
				.then(shows=>{
					let results = []
					shows.forEach(show=>{
						if (!show.episodes.length) return
						show.episodes.sort((a,b)=>{
							if (a.episode > b.episode) return 1
							if (a.episode < b.episode) return -1
							return 0
						})
						results.push(show)
					})
					res.send(results)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})

	router.route('/upcoming')
		.get((req,res)=>{
			Show.upcomingEpisodes()
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

	
	// Show
	router.route('/:slug')
		.delete((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					return req.trakt.sync.collection.remove({
						shows: [{id:show.ids}]
					})
					.then(()=>{
						return show
					})
				})
				.then(show=>{
					return show.unsubscribe(req.user._id).save()
				})
				.then(show=>{
					return show.save()
				})
				.then(()=>{
					res.status(204).end()
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
		.get((req,res)=>{
			Show.findBySlug(req.params.slug)
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
					res.send(episodes)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
	
	router.route('/:slug/seasons/:season/episodes/:episode')
		.get((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					let episodes = show.episodes.filter(item=>{
						return item.season == req.params.season && item.episode == req.params.episode
					})
					if (episodes) res.send(episodes[0])
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
					
					let idx = show.episodes.findIndex(item=>{
						return item.season == req.params.season && item.episode == req.params.episode
					})
					
					if (idx){
						show.episodes[idx].setWatched(req.user)
							.then(()=>{
								return show.save()
							})
							.then(()=>{
								res.send(show.episodes[idx])
							})
							.catch(error=>{
								res.status(400).send({error:error.message})
							})
					} else {
						res.status(404).end()
					}
				})
				.catch(error=>{
					res.status(400).send({error:error.message})
				})
		})
	
	
	// SHOW - DOWNLOAD
	router.route('/:slug/seasons/:season/episodes/:episode/download')
		.post((req,res)=>{
			Show.findBySlug(req.params.slug)
				.then(show=>{
					if (!show) throw new Error(`Show not found: ${req.params.slug}`)
					let idx = show.episodes.findIndex(item=>{
						return item.season == req.params.season && item.episode == req.params.episode
					})
					if (!idx) throw new Error(`Episode not found:`)
					
					// Could be better...
					
					return this.episodes[idx].getMagnet()
						.then(magnet=>helpers.torrents.add(magnet))
						.then(hash=>{
							return this.episodes[idx].setDownloading(hash)
						})
						.then(()=>{
							return show.save()
						})
				})
				.then(()=>{
					res.send({success:true})
				})
				.catch(error=>{
					res.status(400).send({error:error})
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