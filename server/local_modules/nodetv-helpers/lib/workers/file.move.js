"use strict"

process.on('message', function(msg){
	require('fs-extra').move(msg.source, msg.target, {overwrite:true})
		.then(()=>{
			process.exit()
		})
		.catch(error=>{
			process.send(error)
			process.exit(1)
		})
})