"use strict"

// Automatically load tasks from directory
require('fs-extra').readdir(require('path').join(__dirname,'tasks'))
	.then(files=>{
		files.forEach(file=>{
			let match = file.match(/(.*)\.js$/i)
			if (match){
				require(require('path').join(__dirname,'tasks',file))
			}
		})
		return null
	})
	.catch(error=>{
		if (error) console.error(error)
	})