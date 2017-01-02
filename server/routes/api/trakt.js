"use strict";

const User = require(process.env.MODELS+'/user');

var TraktAPI = function(app){
	console.debug('API loaded: Trakt');
	
	app.route('/api/auth/trakt')
		.delete(function(req,res){
			User.findById(req.user._id)
				.then(user=>{
					user.trakt = {
						access_token: null,
						expires: new Date(),
						refresh_token: null
					};
					return user.save();
				})
				.then(()=>{
					res.status(204).end();
				})
				.catch(error=>{
					res.status(400).send({error:error});
				})
		})
		.get(function(req,res){
			res.send({url:req.trakt.get_url()});
		})
		.post(function(req,res){
			User.findById(req.user._id,{password:false,tokens:false,trakt:false})
				.then(user=>{
					return req.trakt.exchange_code(req.body.pin)
						.then(()=>{
							let result = req.trakt.export_token(); 
							user.trakt = {
								access_token: result.access_token,
								expires: new Date(result.expires),
								refresh_token: result.refresh_token
							}
							return user;
						})
						.then(()=>{
							return req.trakt.users.settings({username:''})
						})
						.then(settings=>{
							user.profile = settings.user;
							return user.save();
						});
				})
				.then(user=>{
					res.send(user);
				})
				.catch(error=>{
					console.error(error)
					res.status(400).send({error:error});
				});
		});
	
	
	app.route('/api/trakt/profile')
		.get(function(req,res){
			req.trakt.users.settings({username:''})
				.then(settings=>{
					return User.findById(req.user._id,{password:false,tokens:false,trakt:false})
						.then(user=>{
							user.profile = settings.user;
							return user.save();
						})
				})
				.then(user=>{
					res.send(user);
				})
				.catch(error=>{
					res.status(400).send({error:error});
				})
		})
	
	app.route('/api/search/:type')
		.all(function(req,res){
			// Search Trakt.tv
			var query = req.body.q || req.query.q;
			
			new Promise((resolve,reject)=>{
				if (['movie','show'].indexOf(req.params.type) === -1) return reject({message:'Invalid search type'});
				
				req.trakt.search.text({type:req.params.type, query:query, extended:'full'})
					.then(resolve)
					.catch(reject);
			})
			.then(results=>{
				res.send(results);
			})
			.catch(error=>{
				res.status(400).send({error:error});
			})
		})
}
module.exports = TraktAPI;