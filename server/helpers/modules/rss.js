"use strict";

const parser = require('rss-parser');
const utils = require('./utils');

// PARSE RSS FEEDS

exports.get = (url)=>{
	return new Promise((resolve,reject)=>{
		if (!url) return reject();
		
		require('rss-parser').parseURL(url, function(error,json){
			try {
				if (error) throw error;
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
								console.error(error);
							})
					})
					resolve(response);
				}
			} catch(error){
				reject(error);
			}
		});
	});
};
