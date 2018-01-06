"use strict"

const helpers = require('nodetv-helpers')
const router = require('express').Router()

const Movie = helpers.model('movie')


const MoviesAPI = (api)=>{
	console.debug('API loaded: Movies')
	api.use('/movies', router)
	
	router.route('/')
		.get((req,res)=>{
			Movie.findByUser(req.user)
				.then(movies=>{
					movies.sort((a,b)=>a.title.toLowerCase().localeCompare(b.title.toLowerCase()))
					res.send(movies)
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(404).send({error:error.message})
				})
		})
		.post((req,res)=>{
			Movie.findBySlug(req.body.slug)
				.then(movie=>{
					if (movie) return movie
					movie = new Movie({ids:{slug:req.body.slug}})
					return movie.sync(req.user)
				})
				.then(movie=>{
					// Subscribe to show
					return movie.subscribe(req.user).save({new:true})
				})
				.then(movie=>{
					res.status(201).send(movie)
					return movie.parseFeed()
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(400).send({error:error})
				})
		})
	
	router.route('/available')
		.get((req,res)=>{
			// TODO: Add proxy support and caching
			return require('request-promise').get({url:'https://yts.me/api/v2/list_movies.json', qs:{limit:12}, json:true, proxy:false})
				.then(json=>{
					let results = json.data.movies.map(item=>{
						return {
							title: item.title,
							year: item.year,
							ids: {
								imdb: item.imdb_code,
								slug: item.slug
							},
							image: item.medium_cover_image,
							added: new Date(item.date_added)
						}
					})
					res.send(results)
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(404).end()
				})
		})
	
	router.route('/scan')
		.post((req,res)=>{
		//	Movie.find({}).each(movie=>movie.scan())
			res.status(202).end()
		})
	router.route('/sync')
		.post((req,res)=>{
			Movie.syncCollection(req.user)
			res.status(202).end()
		})
	router.route('/upgrade')
		.post((req,res)=>{
			Movie.scanAll()
			res.status(202).end()
		})
	
	router.route('/:slug')
		.delete((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					return movie.unsubscribe(req.user).save()
				})
				.then(()=>{
					res.status(204).end()
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(400).send({error:error.message})
				})
		})
		.get((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					if (!movie) throw new Error(`Movie not found`)
					res.send(movie)
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(400).send({error:'Bad Request'})
				})
		})
	
	router.route('/:slug/feeds')
		.patch((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					if (!movie) throw new Error(`Movie not found: ${req.params.slug}`)
					return movie.parseFeed()
				})
				.then(movie=>{
					res.status(200).send(movie.hashes || [])
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(404).send({error:error.message})
				})
		})

	router.route('/:slug/sync')
		.post((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					return movie.sync(req.user)
				})
				.then(movie=>{
					return movie.save({new:true})
				})
				.then(movie=>{
					res.send(movie)
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(400).send({error:'Bad request'})
				})
		})
	
	router.route('/:slug/artwork')
		.get((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					return helpers.trakt().images.get(movie.ids,'movie')
				})
				.then(images=>{
					res.send(images)
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(400).send({error:'Bad request'})
				})
		})
		.post((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					return movie.setArtwork(req.body).then(()=>movie.save({new:true}))
				})
				.then(movie=>{
					res.send(movie)
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(400).end()
				})
		})

	router.route('/:slug/collected')
		.post((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					if (!movie) throw new Error(`Movie not found`)
					return helpers.trakt(req.user).sync.collection.add({
						movies: [{
							ids: movie.ids
						}]
					})
					.then(()=>{
						movie.setCollected()
						return movie.save({new:true})
					})
				})
				.then(movie=>{
					res.send(movie)
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(400).send({error:'Bad Request'})
				})
		})
	
	router.route('/:slug/download')
		.post((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					if (!movie) throw new Error(`Movie not found: ${req.params.slug}`)
					
					if (!req.body.hash) throw new Error(`Download quality not selected: ${movie.title}`)
					
					let idx = movie.hashes.findIndex(hash=>hash.btih===req.body.hash)
					if (idx == -1) throw new Error(`Download quality not available: ${movie.title}`)
					
					let hash = movie.hashes[idx]
					
					return helpers.torrents.createMagnet(hash.btih)
						.then(magnet=>{
							return helpers.torrents.add(magnet)
						})
						.then(()=>{
							return movie.setDownloading(hash)
						})
						.then(()=>{
							return movie.save()
						})
				})
				.then(()=>{
					res.send({success:true})
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(400).end()
				})
		})
	
	router.route('/:slug/play')
		.post((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					if (!movie) throw new Error(`Show not found: ${req.params.slug}`)
					return movie.play(req.user, req.body.device.url)
				})
				.then(()=>{
					res.status(200).end()
				})
				.catch(error=>{
					if (error) console.error(error)
					res.status(400).end()
				})
		})
	
	router.route('/:slug/scan')
		.post((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					if (!movie) throw new Error(`Movie not found: ${req.params.slug}`)
					
					movie.scan()
					
					res.status(202).end()
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(404).end()
				})
		})
	
	router.route('/:slug/watched')
		.post((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					if (!movie) throw new Error(`Movie not found`)
					return helpers.trakt(req.user).history.add({
						movies: [{
							ids: movie.ids
						}]
					})
					.then(()=>{
						movie.setWatched(req.user)
						return movie.save({new:true})
					})
				})
				.then(movie=>{
					res.send(movie)
				})
				.catch(error=>{
					if (error) console.error(error.message)
					res.status(400).send({error:'Bad Request'})
				})
		})
		
}
module.exports = MoviesAPI