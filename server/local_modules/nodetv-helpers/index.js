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

/*
const Config = function(){
	this.config = {}
}
Config.prototype.set = function(name,value){
	this.config[name] = value
	return this
}
Config.prototype.get = function(name){
	return this.config[name] || undefined
}

exports.config = new Config()
*/