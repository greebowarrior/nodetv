"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var Database = (config)=>{
	
	var conn = 'mongodb://';
	
	if (config.auth){
		conn += config.user+':'+config.pass+'@';
	}
	conn += config.host+':'+config.port;
	conn += '/'+config.name;
	
	mongoose.connect(conn);
	mongoose.connection.on('error', (error)=>{
		console.error(error);
	})
	
	mongoose.connection.on('connected', ()=>{
		console.info('Connected to MongoDB: %s', config.host);
	});
	
	process.on('SIGTERM', ()=>{
		mongoose.disconnect();
	});
};

module.exports = Database;