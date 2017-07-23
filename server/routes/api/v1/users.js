"use strict"

const helpers = require('nodetv-helpers')
const router = require('express').Router()

const User = helpers.model('user')

const UsersAPI = app=>{
	console.debug('API loaded: Users')
	app.use('/users', router)
	
	// Add ACL Middleware
	
	// TODO: Add some serious auth middleware
	
	router.route('*')
		.post((req,res,next)=>{
			delete req.body.added
			delete req.body.profile
			delete req.body.synced
			delete req.body.tokens
			delete req.body.trakt
			delete req.body.updated
			next()
		})
	
	router.route('/')
		.get((req,res)=>{
			User.find({},{password:false,trakt:false})
				.then(users=>{
					res.send(users)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
		.post((req,res)=>{
			// Add new user
			let user = new User(req.body)
			
			// Set password
			if (req.body.password && req.body.passconf){
				user.setPassword(req.body.password,req.body.passconf)
			}
			// Create a user token
			user.apiToken()
			
			user.save({new:true})
				.then(user=>{
					res.status(201).send({_id:user._id})
				})
				.catch(error=>{
					console.error(error)
					res.status(400).end()
				})
		})
	
	
	router.route('/me')
		.get((req,res)=>{
			User.findById(req.user._id,{password:false,trakt:false})
				.then(user=>{
					res.send(user)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
		.post((req,res)=>{
			// Update me
			User.findById(req.user._id)
				.then(user=>{
					if (req.body.password && req.body.passconf){
						user.setPassword(req.body.password,req.body.passconf)
					}
					delete req.body.password
					Object.assign(user, req.body)
					
					return user.save({new:true})
				})
				.then(()=>{
					res.send({success:true})
				})
				.catch(error=>{
					console.error(error)
					res.status(400).end()
				})
		})
	
	router.route('/:id')
		.delete((req,res)=>{
			User.findById(req.params.id)
				.then(user=>{
					return user.remove()
				})
				.then(()=>{
					res.status(204).end()
				})
				.catch(error=>{
					console.error(error)
					res.status(400).end()
				})
		})
		.get((req,res)=>{
			User.findById(req.params.id,{password:false,trakt:false})
				.then(user=>{
					res.send(user)
				})
				.catch(error=>{
					res.status(404).send({error:error})
				})
		})
		.post((req,res)=>{
			// Update user
			User.findById(req.params.id)
				.then(user=>{
					if (req.body.password && req.body.passconf){
						user.setPassword(req.body.password, req.body.passconf)
					}
					delete req.body.password
					Object.assign(user, req.body)
					
					return user.save({new:true})
				})
				.then(()=>{
					res.status(200).send({success:true})
				})
				.catch(error=>{
					console.error(error)
					res.status(404).end()
				})
		})
	
	router.route('/:id/sync')
		.post((req,res)=>{
			// Sync the user's movies, shows, and watch history
			User.findById(req.params.id)
				.then(user=>{
					res.status(202).end()
					
					return user.syncCollection()
						.map(show=>{
							return show.syncHistory(user)
						})
				})
				.catch(error=>{
					console.error(error)
					res.status(404).end()
				})
		})
}
module.exports = UsersAPI