'use strict';

var fs = require('fs'), path = require('path');

process.on('message', function(msg){
	try {
		if (!msg.source || !msg.target){
			process.send({error:'Missing parameter(s)'});
			process.exit(1);
		}
		
		if (!fs.existsSync(path.dirname(msg.source))){
			require('mkdirp').sync(path.dirname(msg.target), 0o775);
		}
		
		var source = fs.createReadStream(msg.source);
		source.on('error', function(error) {
			process.send(error);
			process.exit(1);
		});
		
		var target = fs.createWriteStream(msg.target);
		target.on('error', function(error){
			process.send(error);
			process.exit(1);
		}).on('finish', function(){
			fs.chmodSync(msg.target,0o664);
			process.exit();
		});
		
		source.pipe(target);
	} catch(e){
		process.send(e);
		process.exit(1);
	}
});