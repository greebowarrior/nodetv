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
					res.status(404).send({error:error})
				})
		})
		.post((req,res)=>{
			Movie.findBySlug(req.body.slug)
				.then(movie=>{
					if (movie) return movie
					movie = new Movie({ids:{slug:req.body.slug}})
					return movie.sync()
				})
				.then(movie=>{
					// Subscribe to show
					return movie.subscribe(req.user).save({new:true})
				})
				.then(movie=>{
					res.status(201).send(movie)
				})
				.catch(error=>{
					console.error(error)
					res.status(400).send({error:error})
				})
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
					res.status(400).send({error:error})
				})
		})
		.get((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					if (!movie) throw new Error(`Movie not found`)
					res.send(movie)
				})
				.catch(error=>{
					console.error(error)
					res.status(400).send({error:'Bad Request'})
				})
		})
	
	router.route('/:slug/sync')
		.post((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					return movie.sync()
				})
				.then(movie=>{
					return movie.save()
				})
				.then(()=>{
					res.send({success:true})
				})
				.catch(error=>{
					console.error(error)
					res.status(400).send({error:'Bad request'})
				})
		})
	
	router.route('/:slug/artwork')
		.get((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					return helpers.trakt().images.get(movie.ids)
				})
				.then(images=>{
					res.send(images)
				})
				.catch(error=>{
					console.error(error)
					res.status(400).send({error:'Bad request'})
				})
		})
		.post((req,res)=>{
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					return movie.setArtwork(req.body).then(()=>movie.save())
				})
				.then(()=>{
					res.send({success:true})
				})
				.catch(error=>{
					console.error(error)
					res.status(404).end()
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
					console.error(error)
					res.status(400).send({error:'Bad Request'})
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
					console.error(error)
					res.status(400).send({error:'Bad Request'})
				})
		})
		
}
module.exports = MoviesAPI