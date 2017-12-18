"use strict"

const helpers = require('nodetv-helpers')

const UPNP = (client)=>{
	
	client.on('upnp.search', ()=>{
		helpers.upnp.search((device)=>{
			client.emit('upnp.device', device)
		})
	})
	
}

module.exports = UPNP