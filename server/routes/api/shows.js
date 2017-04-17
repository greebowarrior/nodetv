"use strict"

const Show = require(process.env.MODELS+'/show')
const helpers = require(process.env.HELPERS)

// probably need to move most of these to another file, so we can call them from tasks
// boo you whore

// TO MOVE: feed, */download, */collected

let ShowsAPI = function(app){
	console.debug('API loaded: Shows')
	
	app.route('/api/shows')
		.get(function(req,res){
			Show.findByUser(req.user._id)
				.then(shows=>{
					res.send(shows || [])
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
		.post(function(req,res){
			new Promise((resolve,reject)=>{
				Show.findBySlug(req.body.slug)
					.then(show=>{
						if (show) return resolve(show)
						// Doesn't exist, need to create a document
						return req.trakt.shows.summary({id:req.body.slug,extended:'full'})
							.then(summary=>{
								console.info('Adding show: %s', summary.title)
								return new Show(summary)
							})
							.then(show=>{
								return req.trakt.seasons.summary({id:req.body.slug,extended:'episodes,full'})
									.then(function(seasons){
										// Loop seasons
										
										seasons.forEach(function(season){
											show.seasons.push({
												season: parseInt(season.number,10),
												ids: season.ids,
												overview: season.overview
											})
											
											// Add/update episodes
											season.episodes.forEach(function(episode){
												show.episodes.push({
													season: parseInt(season.number,10),
													episode: episode.number,
													ids: episode.ids,
													title: episode.title || 'TBA',
													overview: episode.overview,
													first_aired: episode.first_aired ? new Date(episode.first_aired) : null,
													updated_at: episode.updated_at ? new Date(episode.updated_at) : null
												})
											})
											
											/*
											// Sort episodes by int:episode
											show.seasons[season_idx].episodes.sort(function(a,b){
												if (a.episode < b.episode) return -1
												if (a.episode > b.episode) return 1
												return 0
											})
											*/
										})
										// Sort seasons array by int:season
										show.seasons.sort(function(a,b){
											if (a.season < b.season) return -1
											if (a.season > b.season) return 1
											return 0
										})
										resolve(show)
									})
							})
					})
					.catch(reject)
			})
			.then(show=>{
				// Subscribe to show
				return show.subscribe(req.user._id).save()
			})
			.then(show=>{
				res.status(201).send(show)
			})
			.catch(error=>{
				console.error(error)
				res.status(400).send({error:error})
			})
		})
	
	// Show
	app.route('/api/shows/:slug')
		.delete(function(req,res){
			Show.findBySlug(req.params.slug)
				.then(show=>{
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
				.then(()=>{
					res.status(204).end()
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
		.get(function(req,res){
			Show.findBySlug(req.params.slug)
				.then(show=>{
					res.send(show)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
		.post(function(req,res){
			Show.findBySlug(req.params.slug)
				.then(show=>{
					show.config = req.body.config
					return show.save()
				})
				.then(show=>{
					res.send(show)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
	
	app.route('/api/shows/:slug/collected')
		.post(function(req,res){
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
		
	app.route('/api/shows/:slug/download')
		.post(function(req,res){
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
	
	app.route('/api/shows/:slug/feed')
		.get(function(req,res){
			helpers.shows.parseFeed(req.params.slug)
				.then(show=>{
					res.send(show)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		}) // Updated
	
	app.route('/api/shows/:slug/scan')
		.get(function(req,res){
			Show.findBySlug(req.params.slug)
				.then(show=>{
					
					console.log(show.config)
					// scan show directory
					
					
					
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
	app.route('/api/shows/:slug/sync')
	//	.get()	// synchronise with Trakt
	
	app.route('/api/shows/:slug/watched')
		.post(function(req,res){
			helpers.shows.watched(req.params.slug,req.params.user)
				.then(show=>{
					res.send(show)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
			/*
			Show.findBySlug(req.params.slug)
				.then(show=>{
					let watched_at = req.body.watched_at || new Date()
					return req.trakt.history.add({
						shows:[{
							ids:show.ids,
							watched_at: watched_at
						}]
					})
					.then(()=>{
						show.setWatched()
						return show.save()
					})
				})
				.then(show=>{
					res.send(show)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
			*/
		})
	
	// Season
	app.route('/api/shows/:slug/seasons/:season')
		.get(function(req,res){
			Show.findBySlug(req.params.slug)
				.then(show=>{
					return show.getSeason(req.params.season)
				})
				.then(season=>{
					res.send(season)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
	
	app.route('/api/shows/:slug/seasons/:season/collected')
		.post(function(req,res){
			helpers.show.collected(req.params.slug, {season:req.params.season})
				.then(show=>{
					return show.getSeason(req.params.season)
				})
				.then(season=>{
					res.send(season)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})

	app.route('/api/shows/:slug/seasons/:season/download')
		.post(function(req,res){
			// download all episodes in a season
			Show.findBySlug(req.params.slug)
				.then(show=>{
					return show.getSeason(req.params.season)
						.then(season=>{
							season.episode.forEach(episode=>{
								console.debug('Downloading %s - S%dE%d', show.title, season.season, episode.episode)
								// TODO: ADD MAGIC
							})
							return
						})
				})
				.then(()=>{
					res.status(202).end()
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
	
	app.route('/api/shows/:slug/seasons/:season/watched')
		.post(function(req,res){
			helpers.shows.watched(req.params.slug,req.params.user,{season:req.params.season})
				.then(show=>{
					return show.getSeason(req.params.season)
				})
				.then(season=>{
					res.send(season)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
			
			/*
			Show.findBySlug(req.params.slug)
				.then(show=>{
					let watched_at = req.body.watched_at || new Date()
					return req.trakt.history.add({
						shows:[{
							ids: show.ids,
							seasons:[{
								season: parseInt(req.params.season,10)
							}],
							watched_at: watched_at
						}]
					})
					.then(()=>{
						return show.getSeason(req.params.season)
							.then(season=>{
								season.setWatched()
								return show.save()
							})
					})
				})
				.then(show=>{
					return show.getSeason(req.params.season)
				})
				.then(season=>{
					res.send(season)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
			*/
		})
	
	// Episode
	app.route('/api/shows/:slug/seasons/:season/episodes/:episode')
		.get(function(req,res){
			Show.findBySlug(req.params.slug)
				.then(show=>{
					return show.getEpisode(req.params.season, req.params.episode)
						/*
						.then(episode=>{
							return {
								title: show.title,
								ids: show.ids,
								episode: episode
							}
						})
						*/
				})
				.then(episode=>{
					res.send(episode)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})

	app.route('/api/shows/:slug/seasons/:season/episodes/:episodes/collected')
		.post(function(req,res){
			Show.findBySlug(req.params.slug)
				.then(show=>{
					return req.trakt.sync.collection.add({
						episodes:[{
							ids: show.ids,
							seasons: [{
								number: parseInt(req.params.season,10),
								episodes: [{
									number: parseInt(req.params.episode,10)
								}]
							}]
						}]
					})
					.then(()=>{
						return show.getEpisode(req.params.season,req.params.episode)
							.then(episode=>{
								episode.setCollected()
								return show.save()
							})
					})
				})
				.then(show=>{
					return show.getEpisode(req.params.season,req.params.episode)
				})
				.then(episode=>{
					res.send(episode)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})

	app.route('/api/shows/:slug/seasons/:season/episodes/:episode/download')
		.post(function(req,res){
			// Download all episodes in a season
			Show.findBySlug(req.params.slug)
				.then(show=>{
					return show.getEpisode(req.params.season, req.params.episode)
						.then(episode=>{
							return helpers.torrent.getHash(episode.hashes, req.body.hd || episode.config.hd)
								.then(data=>{
									return helpers.torrent.createMagnet(data.btih)
										.then(magnet=>{
											return helpers.torrent.add(magnet)
										})
										.then(result=>{
											episode.hashes[data.idx].hash = result.hashString
											return show.save()
										})
								})
						})
				})
				.then(()=>{
					res.status(202).end()
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
	
	app.route('/api/shows/:slug/seasons/:season/episodes/:episode/watched')
		.post(function(req,res){
			helpers.shows.watched(req.params.slug,req.params.user,{season:req.params.season,episodes:[req.params.episode]})
				.then(show=>{
					return show.getEpisode(req.params.season, req.params.episode)
				})
				.then(episode=>{
					res.send(episode)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
			
			/*
			Show.findBySlug(req.params.slug)
				.then(show=>{
					let watched_at = req.body.watched_at || new Date()
					return req.trakt.history.add({
						shows:[{
							ids: show.ids,
							seasons: [{
								number: parseInt(req.params.season,10),
								episodes: [
									{number: parseInt(req.params.episode,10)}
								]
							}],
							watched_at: watched_at
						}]
					})
					.then(()=>{
						return show.getEpisode(req.params.season, req.params.episode)
							.then(episode=>{
								episode.setWatched()
								return show.save()
							})
					})
				})
				.then(show=>{
					return show.getEpisode(req.params.season, req.params.episode)
				})
				.then(episode=>{
					res.send(episode)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
			*/
		})
}
module.exports = ShowsAPI