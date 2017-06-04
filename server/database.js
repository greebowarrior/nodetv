"use strict"

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const Database = config=>{
	
	let conn = 'mongodb://'
	
	if (config.auth) conn += `${config.user}:${config.pass}@`
	conn += `${config.host}:${config.port}/${config.name}`
	
	mongoose.connect(conn)
		.then(()=>{
			console.info('Connected to MongoDB: %s', config.host)
		})
		.catch(error=>{
			console.error(error.message)
		})
	
	process.on('SIGTERM', ()=>{
		mongoose.disconnect()
		process.exit(0)
	})
}
module.exports = Database