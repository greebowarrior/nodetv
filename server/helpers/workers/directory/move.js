'use strict';

var fs = require('fs'),
	mkdirp = require('mkdirp'),
	path = require('path');


process.on('message', function(msg){
	if (!msg.from || !msg.to){
		process.send({message:'Missing parameter(s)'});
		process.exit(1);
	}
	if (!fs.accessSync(msg.to)){
		process.send({message:'Target directory exists'});
		process.exit(1);
	}
	try {
		fs.rename(msg.from, msg.to, function(error){
			if (error){
				process.send(error);
				process.exit(1);
			}
			process.exit();
		});
	} catch(e){
		process.send(e);
		process.exit(1);
	}
})