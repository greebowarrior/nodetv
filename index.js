'use strict'

process.title = 'NuTV'
process.chdir(__dirname)

global.Promise = require('bluebird')

require('log4js').configure({
	appenders:[{type:'stdout',layout:{type:'pattern',pattern:'[%[%p%]]\t- %m'}}],
	replaceConsole: true
})

require('./server/server.js')