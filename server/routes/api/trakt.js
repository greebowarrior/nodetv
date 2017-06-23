"use strict"

const router = require('express').Router()
const helpers = require('nodetv-helpers')

const Socket = require(require('path').join(process.env.MODELS,'socket'))
const User = require(require('path').join(process.env.MODELS,'user'))

const TraktAPI = (app,io)=>{
	console.debug('API loaded: Trakt')
	app.use('/api/trakt', router)
	
	router.route('/auth')
		.delete((req,res)=>{
			User.findById(req.query.id)
				.then(user=>{
					user.trakt = undefined
					user.profile = undefined
					return user.save({new:true})
				})
				.then(user=>{
					Socket.findByUser(user)
						.then(sockets=>{
							sockets.forEach(socket=>{
								io.to(socket.id).emit('trakt.connected', false)
							})
						})
					res.status(204).end()
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
		})
		.post((req,res)=>{
			User.findById(req.body.id)
				.then(user=>{
					if (user.trakt.access_token) return res.send(user.profile)

					return helpers.trakt().get_codes()
						.then(poll=>{
							res.send({
								expires_in: poll.expires_in,
								user_code: poll.user_code,
								verification_url: poll.verification_url
							})
							return helpers.trakt().poll_access(poll)
						})
						.then(result=>{
							let expires = new Date()
							expires.setSeconds(expires.getSeconds()+result.expires_in)
							result.expires = expires
							
							user.trakt = {
								access_token: result.access_token,
								expires: result.expires,
								refresh_token: result.refresh_token
							}
							
							return helpers.trakt(user).users.settings()
						})
						.then(settings=>{
							console.log(settings)
							user.profile = settings.user
							
							return user.save({new:true})
						})
				})
				.then(user=>{
					return Socket.findByUser(user)
						.then(sockets=>{
							sockets.forEach(socket=>{
								io.to(socket.id).emit('trakt.connected', user.profile)
							})
						})
				})
				.catch(error=>{
					console.error(error.message)
					
					Socket.findByUser(req.user)
						.then(sockets=>{
							sockets.forEach(socket=>{
								io.to(socket.id).emit('trakt.connected', false)
							})
						})
				})
		})
		
	router.route('/profile')
		.get((req,res)=>{
			/*
			req.trakt.users.settings({username:''})
				.then(settings=>{
					return User.findById(req.user._id,{password:false,tokens:false,trakt:false})
						.then(user=>{
							user.profile = settings.user
							return user.save()
						})
				})
				.then(user=>{
					res.send(user)
				})
				.catch(error=>{
					res.status(400).send({error:error})
				})
			*/
			res.send({})
		})
	
	router.route('/search/:type')
		.all((req,res)=>{
			// Search Trakt.tv
			let query = req.body.q || req.query.q
			
			new Promise((resolve,reject)=>{
				if (['movie','show'].indexOf(req.params.type) === -1) return reject({message:'Invalid search type'})
				
				helpers.trakt().search.text({type:req.params.type, query:query, extended:'full'})
					.then(resolve)
					.catch(reject)
			})
			.then(results=>{
				res.send(results)
			})
			.catch(error=>{
				console.error(error)
				res.status(400).send({error:error})
			})
		})
}
module.exports = TraktAPI