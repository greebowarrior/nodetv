"use strict";

var User = require(process.env.MODELS+'/user');

var API = function(app,io){
	
	app.route('/api/ping')
		.all(function(req,res){
			res.send({ping:'pong'});
		});
	
	app.route('/api/*')
		.all(function(req,res,next){
			User.findById(req.user._id)
				.then(user=>{
					// The instance of Trakt is tied to the request
					// Probably not the most efficient method, but the best I can think of right now
					
					var TraktTV = require('trakt.tv');
					req.trakt = new TraktTV({
						client_id: global.config.trakt.client_id,
						client_secret: global.config.trakt.client_secret,
						redirect_uri: global.config.trakt.request_uri,
					//	plugins: ['ondeck','images'],
						options: {
							images: {
								fanartApiKey: '10a5cf1abee822aa7158e36af571d8d1',
								tmdbApiKey: '6e671df83bbd7b4cb06395b2488dc40a',
								tvdbApiKey: 'B77582079E378FF3'
							}
						}
					});
					
					if (user.trakt){
						return req.trakt.import_token(user.trakt)
							.then(result=>{
								if (result.access_token !== user.trakt.access_token){
									user.trakt = {
										access_token: result.access_token,
										expires: new Date(result.expires),
										refresh_token: result.refresh_token
									};
									return user.save()
								}
							})
					}
					return;
				})
				.then(()=>{
					next();
				})
				.catch(error=>{
					res.status(400).send({error:error});
				})
		});
	
	// Load API modules
	require('fs').readdirSync(require('path').join(__dirname,'api')).forEach((file)=>{
		try {
			if (file.match(/\.js$/)){
				require('./api/'+file)(app,io);
			}
		} catch(e){
			console.error(e.message);
		}
	});
	
	// Send '501 Not Implemented' for requests to undefined endpoints
	app.route('/api/*')
		.all(function(req,res){
			res.status(501).send({error:'Not Implemented',url:req.url});
		});
};

module.exports = API;