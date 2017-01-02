"use strict";

const User = require(process.env.MODELS+'/user');

module.exports = function(app,io){
	
	io.use(function(socket,next){
		if (socket.authenticated) next();
		next(new Error('Athentication error'));
	});
	
	io.on('connection', function(socket){
		socket.authenticated = false;
		
		socket.on('disconnect', ()=>{
			socket.authenticated = false;
		});
		
		
		
		socket.on('authenticate', (data)=>{
			User.findByToken(data.username, data.token)
				.then(user=>{
					if (user) socket.authenticated = true;
				})
				.catch(()=>{
					
				})
		})
		
		
	});
};