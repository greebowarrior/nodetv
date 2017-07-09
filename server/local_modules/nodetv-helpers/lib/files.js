"use strict"

const fs = require('fs-extra')
const path = require('path')

const forked = function(worker, data){
	return new Promise((resolve,reject)=>{
		require('child_process')
			.fork(__dirname+'/workers/'+worker)
			.on('message', (msg)=>{
				if (msg.errno){
					let error = require('syserrno').errorForCode(msg.code)
					if (msg.path) error.message += `: ${msg.path}`
					reject(error)
				}
			})
			.on('exit', (code)=>{
				if (code == 0) resolve()
			})
			.send(data)
	})
}

exports.copy = function(source, target, transcode = false){
	return fs.ensureDir(path.dirname(target))
		.then(()=>{
			if (transcode) {
				return forked('file.transcode', {source:source,target:target})
			} else {
				return forked('file.copy', {source:source,target:target})
			}
		})
		.then(()=>{
			return target
		})
}
exports.download = function(url, target){
	return fs.ensureDir(path.dirname(target))
		.then(()=>{
			return forked('file.download', {source:url,target:target})
		})
		.then(()=>{
			return target
		})
}
exports.delete = function(source){
	return forked('file.delete', {source:source})
}
exports.link = function(source,target){
	return fs.ensureDir(path.dirname(target))
		.then(()=>{
			return fs.ensureSymlink(source,target)
		})
}
exports.move = function(source, target){
	return fs.ensureDir(path.dirname(target))
		.then(()=>{
			return forked('file.move', {source:source,target:target})
		})
		.then(()=>{
			return target
		})
}