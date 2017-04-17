"user strict"

const path = require('path')

const secret = 'Customer-Service-Immolation-Incident'

const session = require('express-session')
const MongoStore = require('connect-mongo')(session)

const App = function(app){
	
	// Express Setup
	app.use(require('body-parser').json({limit:'25mb'}))
	app.use(require('body-parser').urlencoded({extended:false,limit:'25mb'}))
	app.use(require('compression')())
	app.use(require('helmet')())
	
	app.set('index', false)
	app.set('json spaces', 2)
	app.set('trust proxy', true)
	app.set('x-powered-by', false)
	
	// Template Engine
	app.engine('html', require('ejs').renderFile)
	app.set('view engine', 'html')
	app.set('views', path.join(process.cwd(),'app','views'))
	
	// Enable layout templates
	app.set('layout', 'layouts/classic')
	app.use(require('express-ejs-layouts'))
	
	// Define static paths
	app.use('/static', require('express').static(path.join(process.cwd(),'app'),{etag:false}))
	
	app.locals.nutv = require('../package.json')
	
	// Sessions
	app.use(session({
		resave: false,
		saveUninitialized: true,
		secret: secret,
		store: new MongoStore({
			mongooseConnection: require('mongoose').connection
		})
	}))
	
}
module.exports = App