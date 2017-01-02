'use strict';

var fs = require('fs'),
	mkdirp = require('mkdirp'),
	path = require('path');


process.on('message', function(directory){
	if (!directory){
		process.send({message:'Missing parameter(s)'});
		process.exit(1);
	}
	if (!fs.existsSync(directory)){
		process.exit(1);
	}
	try {
		fs.readdir(directory, function(error, list){
			if (error) {
				process.send(error);
				process.exit(1);
			}
			if (list.length){
				list.forEach(function(item){
					var fullpath = directory + '/' + item;
					
					fs.lstat(fullpath, function(error, stats){
						if (error) return;
						if (item.match(/^\./)) return;
						
						if (stats.isDirectory()){
							return self.listDirectory(fullpath, callback);
						} else if (stats.isFile() || stats.isSymbolicLink()) {
							
							var record = {'path':fullpath,'stat':stats};
							
							if (typeof(callback) == 'function') callback(error, record);
							
						}
					});
					
				});
				
				
			}
		});
		
		
		
		
	} catch(e){
		process.send(e);
		process.exit(1);
	}
});