"use strict"

require('dotenv-extended').load()

process.title = 'NuTV'
process.chdir(__dirname)

require('log4js').configure({
	appenders:[{type:'stdout',layout:{type:'pattern',pattern:'[%[%p%]]\t- %m'}}],
	replaceConsole: true
})

switch (process.env.NODE_ENV){
	case 'production':
		require('log4js').getLogger('console').setLevel('INFO')
		break
	case 'testing':
		require('log4js').getLogger('console').setLevel('DEBUG')
		break
	default:
		require('log4js').getLogger('console').setLevel('ALL')
}

try {
	require('newrelic')
} catch(e){
	console.warn('New Relic monitoring not enabled')
}

global.Promise = require('bluebird').Promise
Promise.config({warnings:false})

require('./server/server.js')
