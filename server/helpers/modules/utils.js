"use strict";

const regex = {
	daily: /([\d]{4})(?:\D)?([\d]{1,2})(?:\D)?([\d]{1,2})?/i,
	episodic: /(?:[a-z]+)?\s?(\d{1,2})(?:\:[\w\s]+)?[\/\s]*(?:E|x|[a-z]{2,})\s?([\d]+)(?:(?:E|-)\s?([\d]{2,})){0,}/i,
	mrrobot: /eps([\d])\.([\d]+)_/i
};

exports.isHD = (filename)=>{
	return filename.match(/1080p|720p/i) ? true : false;
};

exports.getQuality = (filename)=>{
	let match = filename.match(/([0-9]+p)/i);
	if (match[1]) return match[1].toLowerCase();
	return 'SD';
};

exports.isRepack = (filename)=>{
	return filename.match(/final|proper|repack|rerip/i) ? true : false;
};

exports.getInfoHash = (magnet)=>{
	if (magnet.match(/btih\:([\w]{32,40})/i)){
		let match = magnet.match(/btih\:([\w]{32,40})/i);
		return match[1].toUpperCase();
	}
	return false;
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