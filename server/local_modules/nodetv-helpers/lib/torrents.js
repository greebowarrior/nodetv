"use strict"

const Transmission = require('transmission')

const torrent = new Transmission({
	host: process.env.TRANSMISSION_HOST || '127.0.0.1',
	port: process.env.TRANSMISSION_PORT || 9091,
	username: process.env.TRANSMISSION_USERNAME || null,
	password: process.env.TRANSMISSION_PASSWORD || null,
	url: process.env.TRANSMISSION_URL || '/transmission/rpc'
})

const trackers = [
	'udp://tracker.opentrackr.org:1337',
	'udp://tracker.coppersurfer.tk:6969',
	'udp://tracker.leechers-paradise.org:6969',
	'udp://ipv6.leechers-paradise.org:6969/announce',
	'http://tracker.trackerfix.com:80'	
]

exports.add = function(url){
	return new Promise((resolve,reject)=>{
		torrent.addUrl(url, (error,args)=>{
			if (error) return reject({error:error})
			if (args){
				resolve(args.hashString)
			}
		})
	})
}
exports.blocklist = function(){
	// update blocklist
}
exports.createMagnet = (btih)=>{
	return new Promise((resolve,reject)=>{
		if (!btih) return reject(`No BTIH supplied`)
		let tr = []
		trackers.forEach(tracker=>{
			tr.push('tr='+tracker+'/announce')
		})
		resolve(`magnet:?xt=urn:btih:${btih}&dn=${btih}&${tr.join('&')}`)
	})
}
exports.delete = function(id){
	return new Promise((resolve,reject)=>{
		torrent.remove(id, true, (error,args)=>{
			if (error) return reject(error)
			if (args){
				resolve(args)
			}
		})
	})
}
exports.findByHash = (btih)=>{
	return new Promise((resolve,reject)=>{
		torrent.get((error,args)=>{
			if (error) return reject(error)
			if (args){
				args.torrents.forEach(torrent=>{
					if (torrent.hashString.toUpperCase() == btih.toUpperCase()){
						resolve({
							id: torrent.id,
							hashString: torrent.hashString
						})
					}
				})
				reject()
			}
		})
	})
}
exports.getComplete = function(){
	return new Promise((resolve,reject)=>{
		let response = []
		torrent.get((error,args)=>{
			if (error) return reject(error)
			if (args){
				args.torrents.forEach(torrent=>{
					if (torrent.percentDone != 1) return
					torrent.files.sort((a,b)=>{
						if (a.bytesCompleted < b.bytesCompleted) return 1
						if (a.bytesCompleted > b.bytesCompleted) return -1
						return 0
					})
					let item = {
						id: torrent.id,
						downloadDir: torrent.downloadDir,
						files: torrent.files,
						hashString: torrent.hashString,
						isFinished: torrent.isFinished,
						seedRatioLimit: torrent.seedRatioLimit,
						uploadRatio: torrent.uploadRatio
					}
					response.push(item)
				})
			}
			resolve(response)
		})
	})
}
exports.list = function(){
	return new Promise((resolve,reject)=>{
		torrent.get((error,args)=>{
			if (error) return reject(error)
			if (args) resolve(args.torrents)
		})
	})
}
exports.set = function(id, options){
	return new Promise((resolve,reject)=>{
		torrent.set(id, options, (error)=>{
			if (error) return reject(error)
			resolve()
		})
	})
}