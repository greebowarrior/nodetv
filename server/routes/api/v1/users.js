"use strict"

const helpers = require('nodetv-helpers')
const router = require('express').Router()

const User = helpers.model('user')

const UsersAPI = app=>{
	console.debug('API loaded: Users')
	app.use('/users/', router)
	
	// Add ACL Middleware
	
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
			
			user.password = user.generateHash(req.body.password)
			
			user.save()
				.then(user=>{
					res.send(user)
				})
				.catch(error=>{
					res.status(400).send({error:error})
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
			User.findOneAndUpdate({id:req.user._id},{$set:req.body}, {new:true})
				.then(user=>{
					console.log(user)
					res.status(201).end()
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
			User.findOneAndUpdate({_id:req.params.id}, {$set:req.body})
				.then(()=>{
					res.status(201).end()
				})
		})

}
module.exports = UsersAPI