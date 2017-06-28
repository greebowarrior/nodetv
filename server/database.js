"use strict"

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const Database = ()=>{
	
	let conn = 'mongodb://'
	
	if (process.env.DB_USER && process.env.DB_PASS) conn += `${process.env.DB_USER}:${process.env.DB_PASS}@`
	conn += `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
	
	mongoose.connect(conn) //, {useMongoClient:true})
		.then(()=>{
			console.info('Connected to MongoDB: %s:%d/%s', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME)
		})
		.catch(error=>{
			console.error(error.message)
		})
	
	process.on('SIGTERM', ()=>{
		mongoose.disconnect()
		process.exit(0)
	})
}
module.exports = Database()