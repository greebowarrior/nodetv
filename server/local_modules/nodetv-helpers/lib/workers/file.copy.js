"use strict"

const fs = require('fs-extra')

process.on('message', msg=>{
	try {
		const source = fs.createReadStream(msg.source)
		source.on('error', error=>{
			process.send(error)
			process.exit(1)
		})
		
		const target = fs.createWriteStream(msg.target)
		target.on('error', error=>{
			process.send(error)
			process.exit(1)
		}).on('finish', ()=>{
			process.exit()
		})
		source.pipe(target)
		
	} catch(error){
		process.send(error)
		process.exit(1)
	}
})