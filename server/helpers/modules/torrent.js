"use strict";

var Transmission = require('transmission');
var torrent = new Transmission({
	host: global.config.transmission.host,
	port: global.config.transmission.port,
	username: global.config.transmission.username || null,
	password: global.config.transmission.passord || null,
	url: global.config.transmission.url || '/transmission/rpc'
});

const trackers = [
	'udp://tracker.opentrackr.org:1337',
	'udp://tracker.coppersurfer.tk:6969',
	'udp://tracker.leechers-paradise.org:6969',
	'udp://zer0day.ch:1337',
	'udp://explodie.org:6969'
];

exports.add = function(url){
	return new Promise((resolve,reject)=>{
		torrent.addUrl(url, (error,args)=>{
			if (error) return reject(error);
			if (args){
				// Returns: hashString, id, name
				resolve(args);
			}
		});
	});
};

exports.createMagnet = function(btih, data){
	return new Promise((resolve,reject)=>{
		if (!btih) return reject();
		if (!data) data = {title: btih};
		
		var tr = [];
		trackers.forEach(tracker=>{
			tr.push('tr='+tracker+'/announce');
		});
		resolve('magnet:?xt=urn:btih:'+btih+'&dn='+data.title+'&'+tr.join('&'));
	});
};

exports.delete = function(url){
	return new Promise((resolve,reject)=>{
		torrent.remove(url, true, (error,args)=>{
			if (error) return reject(error);
			if (args){
				resolve(args);
			}
		});
	});
};

exports.getComplete = function(){
	return new Promise((resolve,reject)=>{
		// torrent.active?
		torrent.active((error,args)=>{
			if (error) return reject(error);
			if (args){
				resolve(args.torrents);
			}
		});
	});
};

exports.getHash = function(hashes, hd){
	return new Promise((resolve,reject)=>{
		if (!hashes.length) reject();
		let filtered = hashes.filter(item=>{return item.hd === hd});
		filtered.sort((a,b)=>{
			if (a.added < b.added) return 1;
			if (a.added > b.added) return -1;
			return 0;
		});
		if (!filtered.length) return reject();
		
		let idx = filtered.findIndex(item=>{return item.repack === true});
		if (idx < 0) idx = 0;
		resolve({btih:filtered[0].btih,idx:idx});
	});
};

exports.list = function(){
	return new Promise((resolve,reject)=>{
		torrent.get((error,args)=>{
			if (error) return reject(error);
			if (args){
				// loop results, only return complete/finished torrents
				resolve(args);
			}
		});
	});
};
