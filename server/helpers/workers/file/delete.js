'use strict';

var fs = require('fs');

process.on('message', function(msg){
	if (!msg.target){
		process.send({message:'Missing parameter(s)'});
		process.exit(1);
	}
	if (!fs.existsSync(msg.target)){
		process.exit();
	}
	try {
		fs.unlink(msg.target, function(error){
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
});