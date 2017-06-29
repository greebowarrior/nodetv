"use strict"

const nutv = require('../package.json')

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
