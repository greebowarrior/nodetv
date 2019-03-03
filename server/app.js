"use strict"

const MongoStore = require('connect-mongo')(require('express-session'))

const App = app=>{
	
	// Express Setup
	app.use(require('body-parser').json({limit:'25mb'}))
	app.use(require('body-parser').urlencoded({extended:false,limit:'25mb'}))
	app.use(require('cookie-parser')(process.env.SECRET_KEY))
	
	app.use(require('compression')())
	app.use(require('helmet')())
	
	app.set('index', false)
	app.set('json spaces', 2)
	app.set('trust proxy', true)
	app.set('x-powered-by', false)
	
	// Template Engine
	app.engine('html', require('ejs').renderFile)
	app.set('view engine', 'html')
	app.use(require('express-ejs-layouts'))
	
	if (process.env.NODE_ENV == 'development') app.disable('view cache')
	
	// Define headers and static paths
	app.use((req,res,next)=>{
		res.setHeader('Service-Worker-Allowed', '/')
		next()
	})
	
	// These routes will be bypassed if you're using nginx
	app.use('/static', require('express').static(require('path').join(process.cwd(),'app'),{etag:false}))
	app.use('/media', require('express').static(process.env.MEDIA_ROOT,{etag:false}))
	
	app.locals.nutv = require('../package.json')
	
	app.locals.media = {
		root: process.env.MEDIA_ROOT,
		shows: process.env.MEDIA_SHOWS,
		movies: process.env.MEDIA_MOVIES
	}
	
	// Sessions
	const session =  require('express-session')({
		cookie: {
	//		secure: process.env.NODE_ENV==='production' ? true : false
		},
		proxy: true,
		resave: false,
		saveUninitialized: true,
		secret: process.env.SECRET_KEY,
		store: new MongoStore({
			mongooseConnection: require('mongoose').connection,
			ttl: 60*60*24
		})
	})
	app.use(session)
	
	app.use((req,res,next)=>{
		let theme = 'classic'
		// load layout/theme based on request/cookie/session data
		if (req.query.theme || req.cookies.theme){
			// TODO: check theme exists
			theme = req.query.theme || req.cookies.theme
		}
		
		app.locals.theme_path = require('path').join('app','themes',theme)
		app.locals.theme_uri = '/' + require('path').join('static','themes',theme)
		
		app.set('views', require('path').join(process.cwd(),'app','themes',theme,'views'))
		app.set('layout', 'index')
		
		next()
	})
}
module.exports = App