'use strict';

var fs = require('fs'),
	mkdirp = require('mkdirp'),
	path = require('path');


process.on('message', function(msg){
	if (!msg.directory){
		process.send({message:'Missing parameter(s)'});
		process.exit(1);
	}
	
	try {
		// Scan the directory for files and return a list
		
		
		
		if (error){
			process.send(error);
			process.exit(1);
		}
		process.exit();
		
	} catch(e){
		process.send(e);
		process.exit(1);
	}
})