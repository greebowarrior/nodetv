'use strict';

process.title = 'NodeTV';
process.chdir(__dirname);

require('log4js').configure({
	appenders:[{type:'console',layout:{type:'pattern',pattern:'[%[%p%]]\t- %m'}}],
	replaceConsole: true
});

require('./server/server.js');