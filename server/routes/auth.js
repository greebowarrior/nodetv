"use strict";

var passport = require('passport');

var LocalStrategy = require('passport-local').Strategy,
	TokenStrategy = require('passport-token').Strategy,
	TraktStrategy = require('passport-trakt').Strategy;

var User = require('../models/user');

passport.serializeUser(function(user,done){
	done(null, user.id);
});

passport.deserializeUser(function(id,done){
	User.findById(id, function(error, user){
		done(error, user);
	});
});

passport.use('local', new LocalStrategy(
	function(username,password,done){
		User.findOne({$or:[{username:username},{email:username}]}, function(error,user){
			if (!error && user && user.verifyPassword(password)){
				return done(null, user);
			}
			return done(error, false);
		});
	}
));

passport.use('token', new TokenStrategy(
	function(username,token,done){
		User.findOne({username:username,'tokens.token':token}, function(error,user){
			if (!error && user){
				return done(null, user);
			}
			return done(error, false);
		});
	}
));

passport.use('trakt', new TraktStrategy(
	{
		clientID: global.config.trakt.client_id,
		clientSecret: global.config.trakt.client_secret,
		callbackURL: global.config.trakt.redirect_uri
	},
	function(accessToken, refreshToken, params, profile, done){
		User.findOne({'trakt.id': profile.id}, function(error, user){
			return done(error, user);
		});
	}
));

var Auth = function(app){
	app.use(passport.initialize());
	app.use(passport.session());
	
	app.route('/login')
		.all(function(req,res,next){
			if (req.user){
				return res.redirect('/');
			}
			return next();
		})
		.get(function(req,res){
			res.render('auth/login', {layout:'layouts/modern'});
		})
		.post(passport.authenticate('local', {failureRedirect:'/login'}), function(req,res){
			res.redirect('/');
		});
	
	app.route('/logout')
		.get(function(req,res){
			req.logout();
			res.redirect('/login');
		});
	
	app.route('/auth/token')
		.get(function(req,res){
			if (req.user){
				User.findById(req.user._id)
					.then(function(user){
						var token = user.apiToken();
						res.header('X-Username', user.username);
						res.header('X-Token', token);
						res.send({username:user.username,token:token});
					})
					.catch(function(error){
						res.status(404).send({error:error});
					})
			} else {
				res.status(401).send({error:'Unauthorized'});
			}
		});
	
	// Secure all API routes with token authentication
	app.route('/api/*')
		.all(passport.authenticate('token'));
};

module.exports = Auth;