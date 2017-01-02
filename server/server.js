"use strict";

var path = require('path');
const nutv = require('../package.json');

try {
	switch (process.env.NODE_ENV){
		case 'production':
			global.config = require(path.join(process.cwd(),'server','config','production.json'));
			break;
		case 'testing':
			global.config = require(path.join(process.cwd(),'server','config','testing.json'));
			break;
		default:
			global.config = require(path.join(process.cwd(),'server','config','development.json'));
	}
} catch(e){
	console.error(e);
}

process.env.MODELS = path.join(__dirname, 'models');
process.env.HELPERS = path.join(__dirname, 'helpers');

/************************************************************************/
console.info('NodeTV v%s', nutv.version);

// Initialise database
require('./database')(global.config.database);

// Create Web Server
var express = require('express'),
	app = express();

var server = require('http').Server(app),
	io = require('socket.io')(server);

server.listen(process.env.PORT || global.config.server.port || 3001, () => {
	console.log('Listening on port %d', process.env.PORT || global.config.server.port || 3001);
});

// Configure Express
require('./app')(app);

// Load routes and socket handlers
require('./routes/socket')(app,io);

// Load routes
require('./routes/auth')(app,io);
require('./routes/api')(app,io);

require('./routes/trakt')(app);

// Default route
app.route('*')
	.all(function(req,res,next){
		if (req.user) res.locals.user = req.user;
		next();
	})
app.route('/')
	.all(function(req,res,next){
		if (req.user){return next()}
		res.redirect('/login');
	})
	.get(function(req,res){
		res.render('home');
	});