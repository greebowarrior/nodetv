"use strict"

// Keep all the auth mechanisms in one place

//const RateLimit = require('express-rate-limit')

const helpers = require('nodetv-helpers')
const passport = require('passport')
const router = require('express').Router()

const JwtStrategy = require('passport-jwt').Strategy
const LocalStrategy = require('passport-local').Strategy
const TokenStrategy = require('passport-token').Strategy
const TraktStrategy = require('passport-trakt').Strategy

const User = helpers.model('user')

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

passport.use('jwt', new JwtStrategy({
		secretOrKey: process.env.SECRET_KEY,
		jwtFromRequest: require('passport-jwt').ExtractJwt.fromAuthHeaderAsBearerToken()
	},
	(payload, done)=>{
		User.findOne({_id:payload.id}) // {_id:payload.id,username:payload.username,'tokens.token':payload.token}
			.then(user=>{
				if (!user) throw new Error('Invalid user')
				done(null, user)
			})
			.catch(error=>{
				done(error, false)
			})
	}
))
passport.use('local', new LocalStrategy((username,password,done)=>{
	User.findOne({$or:[{username:username.toLowerCase()},{email:username.toLowerCase()}]})
		.then(user=>{
			if (!user.verifyPassword(password)) throw new Error('Invalid password')
			done(null, user)
		})
		.catch(error=>{
			done(error, false)
		})
}))
passport.use('token', new TokenStrategy((username,token,done)=>{
	User.findOne({username:username.toLowerCase(),'tokens.token':token})
		.then(user=>{
			if (!user) throw new Error('Invalid user')
			done(null, user)
		})
		.catch(error=>{
			done(error, false)
		})
}))
passport.use('trakt', new TraktStrategy({
		clientID: process.env.TRAKT_CLIENT_ID,
		clientSecret: process.env.TRAKT_CLIENT_SECRET,
		callbackURL: process.env.TRAKT_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
	},
	(accessToken, refreshToken, params, profile, done)=>{
		User.findOne({'trakt.id': profile.id})
			.then(user=>{
				if (!user) throw new Error('Invalid user')
				done(null, user)
			})
			.catch(error=>{
				done(error, false)
			})
	}
))

const Auth = app=>{
	app.use(passport.initialize())
	app.use(passport.session())
	
	app.use('/auth', router)
	
	// Secure all API routes with token authentication
	app.route('/api/*')
		.all(passport.authenticate(['jwt','token'],{session:false}))
		
	app.route('/logout')
		.get((req,res)=>{
			req.logout()
			res.redirect('/login')
		})
	
	// Limit auth attempts to 1 every 5 seconds
	/*
	router.use(new RateLimit({
		windowMs: 5000,
		max: 1,
		delayMs: 0
	}))
	*/
	router.route('/login')
		.post(passport.authenticate('local'), (req,res)=>{
			if (req.user){
				User.findById(req.user._id)
					.then(user=>{
						let token = user.apiToken()
						
						let jwt = require('jsonwebtoken').sign({id:req.user._id,username:req.user.username,token:token}, process.env.SECRET_KEY)
						res.cookie('jwt', jwt, {maxAge:60*60*24*7*1000})
						
						res.status(200).end()
					})
					.catch(error=>{
						console.debug(error)
						res.status(401).send({error:'Unauthorized'})
					})
			} else {
				res.status(401).send({error:'Unauthorized'})
			}
		})
		
	router.route('/logout')
		.all((req,res)=>{
			req.logout()
			res.status(200).send({success:true})
		})
		
	router.route('/token')
		.get((req,res)=>{
			if (req.user){
				User.findById(req.user._id)
					.then(user=>{
						let token = user.apiToken()
						
						let jwt = require('jsonwebtoken').sign({id:req.user._id,username:req.user.username,token:token}, process.env.SECRET_KEY)
						res.cookie('jwt', jwt, {maxAge:60*60*24*7*1000})
						
						res.send(jwt)
					})
					.catch(()=>{
						res.status(401).send({error:'Unauthorized'})
					})
			} else {
				res.status(401).send({error:'Unauthorized'})
			}
		})
		
	router.route('/install')
		.all((req,res,next)=>{
			// Check if already installed
			User.count()
				.then(count=>{
					if (count) throw new Error(`Forbidden`)
					next()
				})
				.catch(error=>{
					console.error(error)
					res.status(403).send({error:'Forbidden'})
				})
		})
		.get((req,res)=>{
			res.status(200).send({installed:false})
		})
		.post((req,res)=>{
			let user = new User(req.body)
			user.setPassword(req.body.password,req.body.passconf)
			user.save()
				.then(()=>{
					res.status(201).send({installed:true})
				})
				.catch(error=>{
					console.error(error)
					res.status(400).end()
				})
		})
}

module.exports = Auth