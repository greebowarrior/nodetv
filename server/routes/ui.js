"use strict"

const UI = function(app,io){
	
	// Load UI modules
	require('fs-extra').readdir(require('path').join(__dirname,'ui'))
		.then(files=>{
			files.forEach(file=>{
				try {
					if (file.match(/\.js$/)) require('./ui/'+file)(app,io)
				} catch(e){
					console.error(e.message)
				}
			})
		})
		.finally(()=>{
			// Get media files (Better to use an nginx location)
			app.route(/^\/media\/(?:shows|movies)\/(.+)/)
				.get((req,res)=>{
					new Promise((resolve,reject)=>{
						req.params.file = req.params[0]
						if (req.params.file){
							let file = require('path').join(global.config.media.base,global.config.media.shows.path,req.params.file)
							if (require('fs-extra').existsSync(file)) resolve(file)
						}
						reject()
					})
					.then(file=>{
						res.sendFile(file)
					})
					.catch(error=>{
						console.error(error)
						res.sendStatus(404)
					})
				})
			
			app.route('/views/*')
				.get((req,res)=>{
					let template = require('path').join(process.cwd(),'app', req.url)
					
					res.render(template, {layout:false}, (error,html)=>{
						if (error){
							console.error(error)
							res.sendStatus(404)
						}
						if (html) res.send(html)
					})
				})
			
			// Send the dashboard by default
			app.use((req,res)=>{
				res.render(require('path').join(process.cwd(),'app','views','dashboard','index.html'))
			})
		})
}
module.exports = UI