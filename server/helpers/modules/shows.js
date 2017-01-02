"use strict";

const Show = require(process.env.MODELS+'/show');
const utils = require('./utils');


exports.parseFeed = function(slug=false){
	return Show.findBySlug(slug)
		.then(show=>{
			if (!show.config.feed) throw new Error('No RSS feed found');
			
			return new Promise((resolve,reject)=>{
				require('rss-parser').parseURL(show.config.feed, function(error,json){
					try {
						if (error) throw new Error(error);
						if (json){
							let response = [];
							json.feed.entries.forEach(entry=>{
								utils.getEpisodeNumbers(entry.title)
									.then(result=>{
										result.episodes.forEach(episode=>{
											
											// TODO: Support awkward RSS formats (like tvshowsapp.com/feeds)
											// TVSHowsApp uses GUID instead of LINK for magnets
											
											response.push({
												season: result.season,
												episode: episode,
												btih: utils.getInfoHash(entry.link),
												hd: utils.isHD(entry.title),
												repack: utils.isRepack(entry.title)
											});
										});
									})
									.catch(error=>{
										throw error;
									})
							})
							resolve(response);
						}
					} catch(error){
						reject(error);
					}
				});
			})
			.then(hashes=>{
				console.log(hashes);
				hashes.forEach(hash=>{
					show.getEpisode(hash.season, hash.episode)
						.then(episode=>{
							return episode.addInfoHash({
								btih: hash.btih,
								hd: hash.hd,
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
};

/*
exports.createFilename = function(slug,data={season:null,episodes:[],ext:'mkv'}){
	let placeholder = {E:'',S:'',T:'',X:''};
	
	return format.replace(/%(\w)/g, function(match, key){
		return (placeholder[key.toUpperCase()]) ? placeholder[key.toUpperCase()] : key;
	});
};

exports.scanFiles = function(slug=false){
	
	return new Promise((resolve,reject)=>{
		Show.findBySlug(slug)
			.then(show=>{
				if (!show || !show.config.directory) return reject();
				// recursive directory walk, create list, parse with regex
				
				console.log(show)
				
				// update collection document
				
				return show;
			})
			/*
			.then(files=>{
				files.forEach(file=>{
				//	this.createFilename()
				})
				resolve(show);
			})
	});
};
*/


exports.collected = function(slug,user,data={season:null,episodes:[]}){
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
						payload.seasons[0].episodes.push({number:parseInt(episode,10)});
					})
				}
			}
			
			show.subscribers.forEach(subscriber=>{
				// Add to collection for all subscribed users
				
			});
			
			return user.trakt.sync.collection.add({shows:[payload]})
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

exports.watched = function(slug,user,data={season:null,episodes:[]}){
	return Show.findBySlug(slug)
		.then(show=>{
			if (!show) throw new Error('Show not found');
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
