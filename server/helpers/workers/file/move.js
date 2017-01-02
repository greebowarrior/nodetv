'use strict';

var fs = require('fs'), path = require('path');

process.on('message', function(msg){
	try {
		if (!msg.source || !msg.target){
			process.send({message:'Missing parameter(s)'});
			process.exit(1);
		}
		
		if (!fs.existsSync(path.dirname(msg.target))){
			require('mkdirp').sync(path.dirname(msg.target), 0o775);
		}
		
		fs.rename(msg.source, msg.target, function(error){
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