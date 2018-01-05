"use strict"

const UI = (app,io)=>{

	app.route('*')
		.all((req,res,next)=>{
			if (req.user) res.locals.user = req.user
			next()
		})
	
	// Load UI modules
	let uiRoutes = require('path').join(__dirname,'ui')
	
	require('fs-extra').exists(uiRoutes)
		.then(exists=>{
			if (!exists) throw new Error(`routes/ui directory does not exist`)
			
			require('fs-extra').readdir(uiRoutes)
				.then(files=>{
					files.forEach(file=>{
						try {
							if (file.match(/\.js$/)) require('./ui/'+file)(app,io)
						} catch(e){
							console.error(e.message)
						}
					})
				})
		})
		.finally(()=>{
			app.route('/manifest.json')
				.get((req,res)=>{
					const manifest = require('path').join(process.cwd(),'app', 'manifest.json')
					let json = require(manifest)
					json.version = app.locals.nutv.version
					json.description = app.locals.nutv.description
					res.send(json)
				})
			
			// Render views
			app.route('/views/*')
				.get((req,res)=>{
					let template = require('path').join(process.cwd(),'app', req.url)
					res.render(template, {layout:false}, (error,html)=>{
						if (error){
							console.error(error)
							return res.sendStatus(404).end()
						}
						if (html) res.send(html)
					})
				})
			
			// Send the dashboard by default
			app.use((req,res)=>{
				res.render('dashboard/index.html')
			})
		})
		.catch(error=>{
			if (error) console.debug(error.message)
		})
}
module.exports = UI