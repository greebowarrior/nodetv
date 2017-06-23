"use strict"

const passport = require('passport')

const LocalStrategy = require('passport-local').Strategy
const TokenStrategy = require('passport-token').Strategy
const TraktStrategy = require('passport-trakt').Strategy

const User = require(require('path').join(process.env.MODELS,'user'))

passport.serializeUser((user,done)=>{
	done(null, user._id)
})

passport.deserializeUser((id,done)=>{
	User.findById(id)
		.then(user=>{
			done(null, user)
		})
		.catch(error=>{
			done(error, false)
		})
})

passport.use('local', new LocalStrategy((username,password,done)=>{
	User.findOne({$or:[{username:username},{email:username}]})
		.then(user=>{
			if (!user.verifyPassword(password)) throw new Error('Invalid password')
			done(null, user)
		})
		.catch(error=>{
			done(error, false)
		})
}))
passport.use('token', new TokenStrategy((username,token,done)=>{
	User.findOne({username:username,'tokens.token':token})
		.then(user=>{
			if (!user) throw new Error('Invalid user')
			done(null, user)
		})
		.catch(error=>{
			done(error, false)
		})
}))

passport.use('trakt', new TraktStrategy(
	{
		clientID: global.config.trakt.client_id,
		clientSecret: global.config.trakt.client_secret,
		callbackURL: global.config.trakt.redirect_uri
	},
	(accessToken, refreshToken, params, profile, done)=>{
		User.findOne({'trakt.id': profile.id}, (error, user)=>{
			return done(error, user)
		})
	}
))

const Auth = app=>{
	app.use(passport.initialize())
	app.use(passport.session())
	
	/*
	app.route('/login')
		.all((req,res,next)=>{
			if (req.user){
				return res.redirect('/')
			}
			return next()
		})
		.get((req,res)=>{
			res.render('auth/login', {layout:'layouts/classic'})
		})
		.post(passport.authenticate('local', {failureRedirect:'/login'}), (req,res)=>{
			res.redirect('/')
		})
	*/
	
	app.route('/logout')
		.get((req,res)=>{
			req.logout()
			res.redirect('/login')
		})
	
	
	app.route('/auth/login')
		.post(passport.authenticate('local'), (req,res)=>{
			if (req.user){
				User.findById(req.user._id)
					.then(user=>{
						let token = user.apiToken()
						res.send({username:user.username,token:token})
					})
					.catch(()=>{
						res.status(401).send({error:'Unauthorized'})
					})
			} else {
				res.status(401).send({error:'Unauthorized'})
			}
		})
		
	app.route('/auth/logout')
		.all((req,res)=>{
			req.logout()
			res.status(200).end()
		})
		
	app.route('/auth/token')
		.get((req,res)=>{
			if (req.user){
				User.findById(req.user._id)
					.then(user=>{
						let token = user.apiToken()
						res.header('X-Username', user.username)
						res.header('X-Token', token)
						res.send({username:user.username,token:token})
					})
					.catch(()=>{
						res.status(401).send({error:'Unauthorized'})
					})
			} else {
				res.status(401).send({error:'Unauthorized'})
			}
		})
	
	// Secure all API routes with token authentication
	app.route('/api/*')
		.all(passport.authenticate('token'))
}

module.exports = Auth