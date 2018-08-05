"use strict"

exports.model = (name='')=>{
	try {
		return require(require('path').join(process.cwd(),'server','models', name))
	} catch(error){
		throw new Error(`Model not found: ${name}`)
	}
}

exports.files = require('./lib/files')
exports.utils = require('./lib/utils')
exports.torrents = require('./lib/torrents')
exports.trakt = require('./lib/trakt')
exports.upnp = require('./lib/upnp')
