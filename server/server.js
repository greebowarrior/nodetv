"use strict"

global.Promise = require('bluebird').Promise
Promise.config({warnings:false})

const path = require('path')
const nutv = require('../package.json')

try {
	switch (process.env.NODE_ENV){
		case 'production':
			global.config = require(path.join(process.cwd(),'server','config','production.json'))
			require('log4js').getLogger('console').setLevel('INFO')
			break
		case 'testing':
			global.config = require(path.join(process.cwd(),'server','config','testing.json'))
			require('log4js').getLogger('console').setLevel('DEBUG')
			break
		default:
			global.config = require(path.join(process.cwd(),'server','config','development.json'))
			require('log4js').getLogger('console').setLevel('ALL')
	}
} catch(e){
	console.error(e)
}

//const helpers = require('nodetv-helpers')

/************************************************************************/
console.info('NodeTV v%s - %s', nutv.version, process.env.NODE_ENV)

// Initialise database
require('./database')

// Load scheduler
require('./scheduler')

// Load UPnP Server
//require('./upnp')

// Create Web Server
const app = require('express')()
app.set('port', process.env.PORT || 3001)

const server = require('http').Server(app)
const io = require('socket.io')(server)

server.listen(app.get('port'), ()=>{
	console.log(`Listening on port ${app.get('port')}`)
})

// Configure Express
require('./app')(app)

// Load sockets
require('./routes/sockets')(io)
// Load routes
require('./routes/auth')(app,io)
require('./routes/api')(app,io)
require('./routes/ui')(app,io)
