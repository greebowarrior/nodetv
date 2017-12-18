"use strict"

const helpers = require('nodetv-helpers')
const router = require('express').Router()

const UpnpAPI = (app)=>{
	console.debug('API loaded: Shows')
	app.use('/upnp', router)
	
	router.route('/devices')
		.get((req,res)=>{
			helpers.upnp.search()
				.then(devices=>{
					res.send(devices)
				})
				.catch(error=>{
					if (error) console.debug(error)
					res.status(400).end()
				})
		})
}

module.exports = UpnpAPI