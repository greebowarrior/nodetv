"use strict"

process.title = 'NuTV'
process.chdir(__dirname)

require('dotenv-extended').load()

global.Promise = require('bluebird').Promise
Promise.config({warnings:false})

if (!process.env.DLNA_URL){
	// Get an address for the DLNA interface
	let ifaces = require('os').networkInterfaces()
	let address = []
	Object.keys(ifaces).forEach(ifname=>{
		ifaces[ifname].forEach(iface=>{
			// skip loopback and non-ipv4 addresses
			if (iface.internal !== false || iface.family !== 'IPv4') return
			address.push(iface.address)
		})
	})
	if (address.length >= 1) process.env.DLNA_URL = `https://${address[0]}/`
}


require('./server/server.js')