"use strict";

const Show = require(process.env.MODELS+'/show').model
const TraktTV = require('trakt.tv')
//const utils = require('./utils')

const User = global.model('user');

const regex = {
	daily: /([\d]{4})(?:\D)?([\d]{1,2})(?:\D)?([\d]{1,2})?/i,
	episodic: /(?:[a-z]+)?\s?(\d{1,2})(?:\:[\w\s]+)?[\/\s]*(?:E|x|[a-z]{2,})\s?([\d]+)(?:(?:E|-)\s?([\d]{2,})){0,}/i,
	mrrobot: /eps([\d])\.([\d]+)_/i
};

exports.getEpisodeNumbers = function(filename){
	return new Promise((resolve,reject)=>{
		if (filename.match(regex.mrrobot)){
			// Mr Robot needs it's own regex because of the bastard-crazy episode titles
			let match = filename.match(regex.mrrobot);
			let response = {
				season: parseInt(match[1],10),
				episodes: [parseInt(match[2],10)+1]	// Episode numbers are zero-indexed
			};
			resolve(response);
			
		} else if (filename.match(regex.episodic)){
			let match = filename.match(regex.episodic);
			let response = {
				season: parseInt(match[1],10),
				episodes: []
			};
			let i = parseInt(match[2],10), range = match[3] || match[2];
			do {response.episodes.push(i++)} while (i <= range);
			resolve(response);
			
		} else if (filename.match(regex.daily)){
			let match = filename.match(regex.daily);
			let response = {
				year: parseInt(match[1],10),
				month: parseInt(match[2],10),
				day: parseInt(match[3],10)
			}
			resolve(response);
		} else {
			reject();
		}
	});
};


/*exports.parseFeed = function(slug=false){
	return Show.findBySlug(slug)
		.then(show=>{
			if (!show) throw new Error(`Show not found: ${slug}`);
			if (!show.config.feed) throw new Error(`No RSS feed found: ${show.title}`);
			
			return new Promise((resolve,reject)=>{
				require('rss-parser').parseURL(show.config.feed, function(error,json){
					try {
						if (error) throw new Error(error);
						if (json){
							let response = []
							
							console.log(json.feed)
							
							
							json.feed.entries.forEach(entry=>{
								utils.getEpisodeNumbers(entry.title)
									.then(result=>{
										
										result.episodes.forEach(episode=>{
											// TODO: Support awkward RSS formats (like tvshowsapp.com/feeds)
											// TVShowsApp uses GUID instead of LINK for magnets
											response.push({
												season: result.season,
												episode: episode,
												btih: utils.getInfoHash(entry.link),
												hd: utils.isHD(entry.title),
												quality: utils.getQuality(entry.title),
												repack: utils.isRepack(entry.title)
											})
										})
										
									})
									.catch(error=>{
										console.error(error)
									})
							})
							resolve(response)
						}
					} catch(error){
						reject(error);
					}
				});
			})
			.then(hashes=>{
				console.debug(hashes);
				hashes.forEach(hash=>{
					show.getEpisode(hash.season, hash.episode)
						.then(episode=>{
							return episode.addInfoHash({
								btih: hash.btih,
								hd: hash.hd,
								quality: hash.quality,
								repack: hash.repack
							})
						})
						.catch(error=>{
							console.error('RSS Parser', error);
						});
				});
				return show.save();
			})
		})
		.catch(error=>{
			return error;
		})
};*/

exports.collected = function(slug, data={season:null,episodes:[]}){
	return Show.findBySlug(slug)
		.then(show=>{
			if (!show) throw new Error('Show not found');
			let collected_at = data.collected_at || new Date();
			let payload = {
				ids: show.ids,
				collected_at: collected_at
			}
			
			if (data.season){
				payload.seasons = [{number:data.season}];
				if (data.episodes.length){
					payload.seasons[0].episodes = [];
					data.episodes.forEach(episode=>{
						payload.seasons[0].episodes.push({number:parseInt(episode,10)})
					})
				}
			}
			
			show.subscribers.forEach(subscriber=>{
				// Add to collection for all subscribed users
				let trakt = new TraktTV({
					client_id: global.config.trakt.client_id,
					client_secret: global.config.trakt.client_secret,
					redirect_uri: global.config.trakt.request_uri
				})
				
				User.findById(subscriber._id)
					.then(user=>{
						return trakt.import_token(user.trakt)
							.then(result=>{
								if (result.access_token !== user.trakt.access_token){
									user.trakt = {
										access_token: result.access_token,
										expires: new Date(result.expires),
										refresh_token: result.refresh_token
									}
									return user.save()
								}
							})
					})
					.then(()=>{
						return trakt.sync.collection.add({shows:[payload]})
					})
					.catch(error=>{
						throw new Error(error);
					})
			})
			return show.save()
		})
}

exports.download = function(slug, data={season:null,episodes:[]}){
	return Show.findBySlug(slug)
		.then(show=>{
			if (!show) throw new Error(`Show not found: ${slug}`)
			return show.getSeason(data.season)
		})
		.then(season=>{
			let list = []
			if (data.episodes.length){
				list = season.episodes.filter(episode=>{
					return data.episodes.indexOf(episode.episode) >= 0
				})
			} else {
				list = season.episodes
			}
			list.forEach(episode=>{
				// filter hashes by prefered quality
				// if show.hd: 1080 > 720 > HD
				// else: HD
				console.debug(episode)
			})
			
		})
}

exports.watched = function(slug, user, data={season:null,episodes:[]}){
	return Show.findBySlug(slug)
		.then(show=>{
			if (!show) throw new Error(`Show not found: ${slug}`);
			let watched_at = data.watched_at || new Date();
			let payload = {
				ids: show.ids,
				watched_at: watched_at
			}
			if (data.season){
				payload.seasons = [{number:data.season}];
				if (data.episodes.length){
					payload.seasons[0].episodes = [];
					data.episodes.forEach(episode=>{
						payload.seasons[0].episodes.push({number:parseInt(episode,10)});
					})
				}
			}
			// might not work in an API environment?
			return user.trakt.history.add({shows:[payload]})
				.then(()=>{
					if (data.season){
						if (data.episodes.length){
							data.episodes.forEach(episode=>{
								show.getEpisode(data.season,episode).then(ep=>ep.setWatched());
							})
						} else {
							show.getSeason(data.season).then(season=>season.setWatched());
						}
					} else {
						show.setWatched();
					}
					return show.save();
				});
		});
}
