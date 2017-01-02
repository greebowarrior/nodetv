"use strict";

var child = require('child_process'),
	os = require('os'),
	Q = require('q');
	
	


var forkedWorker = function(worker,payload){
	// Use forked processes for heavy file operations
	var deferred = Q.defer();
	var fork = child.fork(__dirname+'/workers/'+worker);
	
	fork.on('message', function(error){
		deferred.reject(error);
		
	}).on('error', function(error){
		deferred.reject(error);
		
	}).on('exit', function(error){
		if (!error){
			deferred.resolve();
		}
	});
	
	fork.send(payload);
	return deferred.promise;
};


module.exports = {
	directory:{
		list: function(path){
			return forkedWorker('directory/list', path);
		},
		move: function(from,to){
			return forkedWorker('directory/move', {from:from,to:to});
		},
		scan: function(path){
			return forkedWorker('directory/move', path);
		}
	},
	file: {
		copy: function(from,to){
			return forkedWorker('file/copy', {from:from,to:to});
		},
		delete: function(target){
			return forkedWorker('file/delete', {target:target});
		},
		download: function(url,to){
			return forkedWorker('file/download', {url:url,to:to});
		},
		move: function(from,to){
			return forkedWorker('file/move', {from:from,to:to});
		},
		sanitize: function(name){
			// Sanitize the filename
			name = name.replace(/[\[\]\/\\]/ig,'');
			if (os.platform() === 'darwin'){
				name.replace(/[\:]/ig, ';'); // OSX doesn't like colons
			}
			return name.trim();
		}
	},
	torrent: {
		createMagnet: function(hash, name){
			try {
				if (!hash){
					return;
				}
				if (!name){
					name = hash;
				}
				var trackers = [
					'udp://exodus.desync.com:6969',
					'udp://open.demonii.com:1337',
					'udp://tracker.blackunicorn.xyz:6969',
					'udp://tracker.coppersurfer.tk:6969',
					'udp://tracker.leechers-paradise.org:6969',
					'udp://tracker.openbittorrent.com:80',
					'udp://tracker.pomf.se:80'
				];
				var tr = [];
				trackers.forEach(function(tracker){
					tr.push('tr='+tracker+'/announce');
				});
				return 'magnet:?xt=urn:btih:'+hash+'&dn='+name+'&'+tr.join('&');
			} catch(e){
				console.error(e);
			}
		},
		getHash: function(magnet){
			var match = magnet.match(/btih\:([\w]{32,40})/i);
			if (match){
				return match[1].toUpperCase();
			}
			return false;
		},
		isHD: function(name){
			return (name.match(/720p|1080p/i)) ? true : false;
		},
		isRepack: function(name){
			return (name.match(/repack|proper/i)) ? true : false;
		}
	}
};