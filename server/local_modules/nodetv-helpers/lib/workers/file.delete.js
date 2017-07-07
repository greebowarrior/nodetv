"use strict"

process.on('message', function(msg){
	require('fs-extra').unlink(msg.source)
		.then(()=>{
			process.exit()
		})
		.catch(error=>{
			process.send(error)
			process.exit(1)
		})
	})
})