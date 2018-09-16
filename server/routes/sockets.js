"use strict"

const helpers = require('nodetv-helpers')


const Socket = helpers.model('socket')
const User = helpers.model('user')

module.exports = io=>{
	io.on('connection', client=>{
		console.debug('Socket (%s) connected', client.id)
		
		new Socket({
			id: client.id,heartbeat: new Date()
		}).save().catch(error=>{
			if (error) console.error(error.message)
		})
		
		client.on('disconnect', ()=>{
			Socket.findOneAndRemove({id:client.id})
				.then(()=>{
					console.debug('Socket (%s) disconnected', client.id)
				})
				.catch(error=>{
					console.error(error)
				})
		})
		
		client.conn.on('heartbeat', ()=>{
			Socket.findOneAndUpdate({id:client.id},{$set:{heartbeat:new Date()}})
				.then(()=>{
					console.debug('Socket (%s) heartbeat', client.id)
				})
				.catch(error=>{
					console.error(error)
				})
		})
		
		// Socket authentication middleware
		client.use((packet,next)=>{
			// Always allow authentication requests
			if (packet[0].match(/^auth\./) || ['authenticate','login','logout'].indexOf(packet[0]) >= 0) return next()
			
			if (!client.user) next(new Error('Unauthorized'))
			next()
			
			/*
			Socket.findBySocket(client.id)
				.then(socket=>{
					if (!socket.user) throw new Error('Unauthorized')
					next()
				})
				.catch(error=>{
					next(error)
				})
			*/
		})
		
		/**************************************************/
				
		client.on('authenticate', (auth,callback)=>{
			if (!auth) return
			
			new Promise((resolve,reject)=>{
				require('jsonwebtoken').verify(auth, process.env.SECRET_KEY, (error,data)=>{
					if (error) return reject(error)
					if (data) return resolve(data)
				})
			})
			.then(data=>{
				return User.findByToken(data.username,data.token)
			})
			.then(user=>{
				if (!user) throw new Error(`User not found`)
				client.user = user
				return Socket.updateOne({id:client.id},{user:user._id})
			})
			.then(()=>{
				client.emit('authenticated', {status:true})
				if (typeof callback === 'function') callback({status:true})
			})
			.catch(error=>{
				if (error) console.error(error.message)
			})
		})
		
		client.on('auth.logout', ()=>{
			delete client.user
			client.emit('authenticated', {status:false})
		})
		
		/**************************************************/
		
		let socketRoutes = require('path').join(__dirname,'sockets')
		
		require('fs-extra').exists(socketRoutes)
			.then(exists=>{
				if (!exists) throw new Error(`routes/sockets directory does not exist`)
				require('fs-extra').readdir(socketRoutes)
					.then(files=>{
						files.forEach(file=>{
							try {
								if (file.match(/\.js$/)) require(`./sockets/${file}`)(client)
							} catch(e){
								console.error(e.message)
							}
						})
					})	
			})
			.catch(error=>{
				console.debug(error.message)
			})
	})
}