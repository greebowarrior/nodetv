"use strict"

// TODO: add to /package.json: "nodetv-helpers": "file:server/local_modules/nodetv-helpers",

exports.files = require('./lib/files')
exports.utils = require('./lib/utils')
exports.torrents = require('./lib/torrents')
exports.trakt = require('./lib/trakt')

exports.model = (name='')=>{
	try {
		return require(require('path').join(process.cwd(),'server','models', name))
	} catch(error){
		console.error(error.message)
	}
}


const Config = function(){
	this.config = {}
	return this
}
Config.prototype.set = function(name,value){
	this.config[name] = value
	return this
}
Config.prototype.get = function(name){
	return this.config[name] || undefined
}

exports.config = new Config()