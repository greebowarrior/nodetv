"use strict"

const API = function(app,io){
	
	app.route('/api/ping')
		.all((req,res)=>{
			res.send({ping:'pong'})
		})
	
	// Load API modules
	require('fs-extra').readdir(require('path').join(__dirname,'api'))
		.then(files=>{
			files.forEach(file=>{
				try {
					if (file.match(/\.js$/)) require('./api/'+file)(app,io)
				} catch(e){
					console.error(e.message)
				}
			})
		})
		.finally(()=>{
			// Send '501 Not Implemented' for requests to undefined endpoints
			app.route('/api/*')
				.all((req,res)=>{
					res.status(501).send({error:'Not Implemented',url:req.url})
				})
		})
}
module.exports = API