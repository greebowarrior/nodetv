"use strict";

var TraktRoutes = function(app){
	
	app.route('/trakt/connect')
		.get(function(req,res){
			res.render('auth/trakt', {});
		});
	
	
};

module.exports = TraktRoutes;