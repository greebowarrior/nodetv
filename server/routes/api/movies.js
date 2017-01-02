"use strict";

var Movie = require(process.env.MODELS+'/movie');

var MoviesAPI = function(app){
	console.debug('API loaded: Movies');
	
	app.route('/api/movies')
		.get(function(req,res){
			Movie.findByUser(req.user._id)
				.then(function(results){
					res.send(results);
				})
				.catch(function(error){
					res.status(404).send({error:error});
				})
		})
		.post(function(req,res){
			new Promise((resolve,reject)=>{
				Movie.findBySlug(req.body.slug)
					.then(movie=>{
						if (movie) return resolve(movie);
						// Doesn't exist, need to create a document
						return req.trakt.movies.summary({id:req.body.slug,extended:'full'})
							.then(summary=>{
								console.info('Adding movie: %s', summary.title);
								return new Movie(summary);
							})
							.then(movie=>{
								resolve(movie);
							});
					})
					.catch(reject);
			})
			.then(movie=>{
				// Subscribe to movie
				return movie.subscribe(req.user._id).save();
			})
			.then(movie=>{
				res.status(201).send(movie);
			})
			.catch(error=>{
				res.status(400).send({error:error});
			})
		})
	
	app.route('/api/movies/:slug')
		.delete(function(req,res){
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					req.trakt.sync.collection.remove({
						movies: [{id:movie.ids}]
					});
					return movie.unsubscribe(req.user._id).save();
				})
				.then(()=>{
					res.status(204).end();
				})
				.catch(error=>{
					res.status(400).send({error:error});
				})
		})
		.get(function(req,res){
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					res.send(movie);
				})
				.catch(error=>{
					res.status(400).send({error:error});
				})
		})
	
	app.route('/api/movies/:slug/collected')
		.post(function(req,res){
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					return req.trakt.sync.collection.add({
						movies: [{
							ids: movie.ids
						}]
					})
					.then(()=>{
						movie.setCollected();
						return movie.save();
					})
				})
				.then(movie=>{
					res.send(movie);
				})
				.catch(error=>{
					res.status(400).send({error:error});
				});
			
		})
	
	app.route('/api/movies/:slug/watched')
		.post(function(req,res){
			Movie.findBySlug(req.params.slug)
				.then(movie=>{
					return req.trakt.history.add({
						movies: [{
							ids: movie.ids
						}]
					})
					.then(()=>{
						movie.setWatched();
						return movie.save();
					})
				})
				.then(movie=>{
					res.send(movie);
				})
				.catch(error=>{
					res.status(400).send({error:error});
				});
		})
};
module.exports = MoviesAPI;