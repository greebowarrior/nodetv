"use strict"

process.title = 'NuTV'
process.chdir(__dirname)

require('dotenv').config()

require('log4js').configure({
	appenders:[{type:'stdout',layout:{type:'pattern',pattern:'[%[%p%]]\t- %m'}}],
	replaceConsole: true
})

try {
	require('newrelic')
} catch(e){
	console.warn('New Relic monitoring not enabled')
}

require('./server/server.js')
