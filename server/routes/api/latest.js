"use strict";

var Show = require(process.env.MODELS+'/show');
var Movie = require(process.env.MODELS+'/movie');

//var helpers = require(process.env.HELPERS);

var LatestAPI = function(app){
	console.debug('API loaded: Latest');
	
	app.route('/api/latest/episodes')
		.get(function(req,res){
			req.trakt.calendars.my.shows({extended:'full'})
				.then(shows=>{
					res.send(shows)
				})
				.catch(error=>{
					res.status(400).send({error:error});
				})
		})
	
	app.route('/api/latest/movies')
		.get(function(req,res){
			Movie.find({downloaded:{$exists:true}},{},{limit:25,sort:{downloaded:-1}})
				.then(results=>{
					res.send(results);
				})
				.catch(error=>{
					res.status(400).send({error:error});
				})
		})
	
	app.route('/api/latest/shows')
		.get(function(req,res){
			Show.findByUser(req.user._id,{},{limit:25,sort:{added:-1}})
				.then(results=>{
					res.send(results);
				})
				.catch(error=>{
					res.status(400).send({error:error});
				})
		})
	
}
module.exports = LatestAPI;