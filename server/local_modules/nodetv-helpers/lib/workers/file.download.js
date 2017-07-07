"use strict"

process.on('message', function(msg){
	try {
		let target = require('fs').createWriteStream(msg.target)
		target.on('error', error=>{
			throw error
		}).on('finish', ()=>{
			process.exit()
		})
		require('request').get(msg.source).pipe(target)
	} catch (error){
		process.send(error)
		process.exit(1)
	}
})