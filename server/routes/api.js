"use strict"

const router = require('express').Router()

const API = (app,io)=>{
	app.use('/api', router)
	
	router.route('/ping')
		.all((req,res)=>{
			res.send({ping:'pong'})
		})
	
	// Load API modules
	require('fs-extra').readdir(require('path').join(__dirname,'api','v1'))
		.then(files=>{
			files.forEach(file=>{
				try {
					if (file.match(/\.js$/)) require('./api/v1/'+file)(router,io)
				} catch(e){
					console.error(e.message)
				}
			})
		})
		.finally(()=>{
			// Send '501 Not Implemented' for requests to undefined endpoints
			router.route('/*')
				.all((req,res)=>{
					res.status(501).send({status:501,error:'Not Implemented',url:req.url})
				})
		})
}
module.exports = API