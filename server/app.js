"use strict"

const secret = 'Customer-Service-Immolation-Incident'

const MongoStore = require('connect-mongo')(require('express-session'))

const App = function(app){
	
	// Express Setup
	app.use(require('body-parser').json({limit:'25mb'}))
	app.use(require('body-parser').urlencoded({extended:false,limit:'25mb'}))
	app.use(require('cookie-parser')())
	
	app.use(require('compression')())
	app.use(require('helmet')())
	
	app.set('index', false)
	app.set('json spaces', 2)
	app.set('trust proxy', true)
	app.set('x-powered-by', false)
	
	// Template Engine
	app.engine('html', require('ejs').renderFile)
	app.set('view engine', 'html')
	app.set('views', require('path').join(process.cwd(),'app','views'))
	
	// Enable layout templates
	app.set('layout', 'layouts/classic')
	app.use(require('express-ejs-layouts'))
	
	app.disable('view cache')
	
	// Define static paths
	app.use('/static', require('express').static(require('path').join(process.cwd(),'app'),{etag:false}))
	
	app.locals.nutv = require('../package.json')
	app.locals.config = global.config
	
	// Sessions
	const session =  require('express-session')({
		resave: false,
		saveUninitialized: true,
		secret: secret,
		store: new MongoStore({
			mongooseConnection: require('mongoose').connection
		})
	})
	
	app.use(session)
	/*
	io.use(require('express-socket.io-session')(session, {
		autoSave: true
	}))
	*/
}
module.exports = App