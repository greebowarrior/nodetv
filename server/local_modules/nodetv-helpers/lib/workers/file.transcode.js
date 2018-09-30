"use strict"

const fs = require('fs-extra')
const mime = require('mime-types')
const ffmpeg = require('ffmpeg-binaries')

process.on('message', (msg)=>{
	try {
		if (!fs.existsSync(msg.source)){
			let error = new Error(`${msg.source}: No such file`)
			error.errno = 34
			error.code = 'ENOENT'
			error.path = msg.source
			throw error
		}
		
		msg.target = msg.target.replace(/\.([\w]+)$/,'.mp4')
		
		let args = ['-i', msg.source,'-c:v', 'copy','-c:a', 'copy','-y']
		
		if (mime.lookup(msg.source) === 'video/x-matroska' && mime.lookup(msg.target) === 'video/mp4'){
			args.push('-sn')
		}
		let file = require('path').parse(msg.target)
		
		// Set the metadata title to match the filename (without filext)
		args.push('-metadata', `title="${file.name}"`)
		
		// TODO: Metadata magic
		/*
		if (msg.metadata){
			let type = null
			case (mime.lookup(msg.target)){
				case 'video/x-matroska':
					type = 'mkv'
					break
				case 'video/mp4':
					type = 'mp4'
					break
			}
			let meta = []
			if (msg.metadata.title) meta['title'] = msg.metadata.title
		//	if (msg.metadata.overview) meta['description'] = msg.metadata.overview
			
			msg.metadata.forEach(meta=>{
				args.push('-metadata', meta.name+'="'+meta.value+'"')
				if (meta.name == 'poster'){
					args.push('-attach', meta.value)
					args.push('-metadata:s:t', 'mimetype='+mime.lookup(meta.value))
				}
			})
		}
		*/
		
		args.push(msg.target)
		
		const remux = require('child_process').spawn(ffmpeg, args)
		remux.on('close', (code)=>{
			process.exit(code)
		})
		remux.stdout.on('data', (data)=>{
			process.send(data.toString())
		})
		remux.stderr.on('data', (data)=>{
			process.send(data.toString())
		})
	} catch(e){
		process.send(e)
		process.exit(1)
	}
})

//ffmpeg -i INPUT.mkv -c:v copy -c:a copy -sn -y OUTPUT.mp4

//ffmpeg -i INPUT.mkv -c:v copy -c:a copy -sn -y -attach image.jpg -metadata:s:t mimetype=image/jpeg OUTPUT.mp4