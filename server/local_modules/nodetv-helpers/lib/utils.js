"use strict"

const regex = {
	daily: /([\d]{4})(?:\D)?([\d]{1,2})(?:\D)?([\d]{1,2})?/i,
	episodic: /(?:[a-z]+)?\s?(\d{1,2})(?:\:[\w\s]+)?[\/\s]*(?:E|x|[a-z]{2,})\s?([\d]+)(?:(?:E|-|-E)\s?([\d]{2,})){0,}/i,
	mrrobot: /eps([\d])\.([\d]+)_/i
}

exports.getEpisodeNumbers = function(filename){
	return new Promise((resolve,reject)=>{
		if (filename.match(regex.mrrobot)){
			// Mr Robot needs it's own regex because of the bastard-crazy episode titles
			let match = filename.match(regex.mrrobot)
			let response = {
				season: parseInt(match[1],10),
				episodes: [parseInt(match[2],10)+1]	// Episode numbers are zero-indexed
			}
			resolve(response)
			
		} else if (filename.match(regex.episodic)){
			let match = filename.match(regex.episodic)
			let response = {
				season: parseInt(match[1],10),
				episodes: []
			}
			let i = parseInt(match[2],10), range = match[3] || match[2]
			do {response.episodes.push(i++)} while (i <= range)
			resolve(response)
			
		} else if (filename.match(regex.daily)){
			let match = filename.match(regex.daily)
			let response = {
				year: parseInt(match[1],10),
				month: parseInt(match[2],10),
				day: parseInt(match[3],10)
			}
			resolve(response)
		} else {
			reject(null) //new Error(`RegExp Failure - title: ${filename}`))
		}
	})
}
exports.getProxy = (options={})=>{
	const defaults = {
		allowsHttps: 1,
		protocol: 'http'
	}
	//if (process.env.PROXY_API_KEY) defaults.apiKey = process.env.PROXY_API_KEY
	
	let qs = Object.assign({}, defaults, options)
	
	return new Promise((resolve)=>{
//		if (process.env.HTTPS_PROXY) return resolve(process.env.HTTPS_PROXY)
		
		require('request-promise')({
			url:'https://api.getproxylist.com/proxy', qs:qs, json:true
		}).then(json=>{
			if (!json.ip) throw new Error(`No proxy returned from GetProxyList.com`)
			process.env.HTTPS_PROXY = `${json.protocol}://${json.ip}:${json.port}`
			resolve(`${json.protocol}://${json.ip}:${json.port}`)
		}).catch(()=>{
			resolve(false)
		})
	})
}
exports.getQuality = (filename)=>{
	let match = filename.match(/([0-9]+p)/i)
	if (match && match[1]) return match[1].toLowerCase()
	return 'SD'
}
exports.isHD = (filename)=>{
	return filename.match(/1080p|720p/i) ? true : false
}
exports.isRepack = (filename)=>{
	return filename.match(/final|proper|repack|rerip/i) ? true : false
}
exports.isProper = (filename)=>{
	return filename.match(/proper/i) ? true : false
}

exports.getInfoHash = (item)=>{
	// tv:info_hash namespace?
	if (item.link && item.link.match(/btih\:([\w]{32,40})/i)){
		// ShowRSS
		let match = item.link.match(/btih\:([\w]{32,40})/i)
		return match[1].toUpperCase()
	} else if (item.guid && item.guid.match(/btih\:([\w]{32,40})/i)){
		// TVShowsApp
		let match = item.guid.match(/btih\:([\w]{32,40})/i)
		return match[1].toUpperCase()
	}
	return false
}

exports.getTraktResolution = (quality)=>{
	let resolution = 'sd_480p'
	switch (quality){
		case '4K':
			resolution = 'uhd_4k'
			break;
		case '1080p':
			resolution = 'hd_1080p'
			break;
		case '720p':
			resolution = 'hd_720p'
			break;
		case 'SD':
			resolution = 'sd_480p'
			break;
	}
	return resolution
}

exports.normalize = (string)=>{
	const Entities = require('html-entities').AllHtmlEntities
	const entity = new Entities()
	return entity.decode(string).replace(/\//g, "\u2215")
}

exports.walkDir = (directory)=>{
	return require('glob-promise')('**/*',{cwd:directory,nodir:true})
		.then(files=>{
			return files
		})
}
