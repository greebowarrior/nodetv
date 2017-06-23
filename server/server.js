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

process.env.MODELS = path.join(__dirname, 'models')

/************************************************************************/
console.info('NodeTV v%s - %s', nutv.version, process.env.NODE_ENV)

// Initialise database
require('./database')(global.config.database)

// Load scheduler
require('./scheduler')

// Load UPnP Server
//require('./upnp')

// Create Web Server
const app = require('express')()
app.set('port', process.env.PORT || global.config.server.port || 3001)

const server = require('http').Server(app)
const io = require('socket.io')(server)

server.listen(app.get('port'), ()=>{
	let port = app.get('port')
	console.log(`Listening on port ${port}`)
})

// Configure Express
require('./app')(app,io)

// Load sockets
require('./routes/sockets')(io)

// Load routes
require('./routes/auth')(app,io)
require('./routes/api')(app,io)
require('./routes/ui')(app,io)

// Default routes
app.route('*')
	.all((req,res,next)=>{
		// Make the user object available to the template engine
		if (req.user) res.locals.user = req.user
		next()
	})
	
app.route('/')
	.all((req,res,next)=>{
		if (req.user) return next()
		res.redirect('/login')
	})
	.get((req,res)=>{
		res.render('home')
	})