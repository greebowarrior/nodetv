"use strict";

var User = require(process.env.MODELS+'/user');

var UsersAPI = function(app){
	console.debug('API loaded: Users');
	
	app.route('/api/users')
		.get(function(req,res){
			User.find({},{password:false})
				.then(users=>{
					res.send(users)
				})
				.catch(error=>{
					res.status(400).send({error:error});
				})
		})
		.post(function(req,res){
			// Add new user
			var user = new User(req.body);
			
			user.password = user.generateHash(req.body.password);
			
			user.save()
				.then(user=>{
					res.send(user);
				})
				.catch(error=>{
					res.status(400).send({error:error});
				})
		})

	app.route('/api/users/me')
		.get(function(req,res){
			User.findById(req.user._id,{password:false,trakt:false})
				.then(user=>{
					res.send(user);
				})
				.catch(error=>{
					res.status(404).send({error:error});
				})
		})
		.post(function(req,res){
			// Update user
			
			
			res.send();
		})
	
	app.route('/api/users/:username')
		.get(function(req,res){
			User.findByUsername(req.params.username,{password:false,trakt:false})
				.then(user=>{
					res.send(user);
				})
				.catch(error=>{
					res.status(404).send({error:error});
				})
		})
		.post(function(req,res){
			// Update user
			
			res.send({});
		})

};
module.exports = UsersAPI;