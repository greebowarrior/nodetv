"use strict";

// Automatically load helpers from modules directory
require('fs').readdirSync(require('path').join(__dirname,'modules')).forEach(file=>{
	try {
		let match = file.match(/(.*)\.js/i);
		if (match){
			exports[match[1]] = require('./modules/'+file);
		}
	} catch(e){
		console.error(e.message);
	}
});


/*
var scheduler = require('node-schedule');
require('fs').readdirSync(require('path').join(__dirname,'tasks')).forEach(file=>{
	try {
		let match = file.match(/(.*)\.js/i);
		if (match){
			require('./tasks/'+file)(scheduler);
		}
	} catch(e){
		console.error(e.message);
	}
});
*/