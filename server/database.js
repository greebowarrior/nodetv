"use strict"

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const Database = (config)=>{
	
	let conn = 'mongodb://'
	
	if (config.auth) conn += `${config.user}:${config.pass}@`
	conn += `${config.host}:${config.port}/${config.name}`
	
	mongoose.connect(conn)
	mongoose.connection.on('error', (error)=>{
		console.error(error)
	})
	mongoose.connection.on('connected', ()=>{
		console.info('Connected to MongoDB: %s', config.host)
	})
	process.on('SIGTERM', ()=>{
		mongoose.disconnect()
		process.exit(0)
	})
}
module.exports = Database