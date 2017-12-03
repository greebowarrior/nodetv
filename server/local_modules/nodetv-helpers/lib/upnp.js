"use strict"

const SSDP = require('node-ssdp').Client
const UMRC = require('upnp-mediarenderer-client')

const UPNP = function(){
	this.devices = []
	
	this.device = undefined
	this.item = undefined
	this.ssdp = new SSDP()
	
	this.search()
}
	
UPNP.prototype.search = function(){
	let ssdp = new SSDP()
	
	this.devices = []
	ssdp.on('response', (headers)=>{
		let device = new (require('upnp-device-client'))(headers.LOCATION)
		
		device.getDeviceDescription((error,desc)=>{
			if (error) console.error(error.message)
			if (desc){
				this.devices.push({
					name: desc.friendlyName,
					udn: desc.UDN,
					url: headers.LOCATION
				})
			}
		})
	})
	
	ssdp.search('urn:schemas-upnp-org:device:MediaRenderer:1')
	return new Promise((resolve)=>{
		setTimeout(()=>{
			resolve(this.devices)
		},1000)
	})
}
UPNP.prototype.setDevice = function(device){
	return new Promise((resolve,reject)=>{
		try {
			this.device = new UMRC(device)
			
			this.device.on('error', (error)=>{
				console.error(error)
			})
			
			this.device.on('loading', ()=>{
				console.debug('device.loading')
			//	trakt.scrobble.start({episode:})
			})
			
			this.device.on('paused', ()=>{
				console.debug('device.paused')
				
			// trakt.scrobble.pause({episode:})
			})
			
			this.device.on('playing', ()=>{
				console.debug('device.playing')
				
				this.device.getPosition((error,position)=>{
					if (error) console.error(error)
					console.debug('position', position)
				})
				
				this.device.getDuration((error,duration)=>{
					if (error) console.error(error)
					console.debug('duration', duration, duration/60)
				})
			})
			
			this.device.on('status', ()=>{
		//		console.debug('device.status',data)
			})
			
			this.device.on('stopped', ()=>{
				console.debug('device.stopped')
				
			//	trakt.scrobble.stop({epsiode:})
			})
			resolve()
		} catch(e){
			console.error(e.message)
			reject()
		}
	})
}

UPNP.prototype.load = function(media={}){
	return new Promise((resolve,reject)=>{
		
		if (!media.file.url) return reject(new Error(`No filedata supplied`))
		
		this.media = media
		
		let options = { 
			autoplay: true,
		//	contentType: 'video/mp4',
			metadata: {
				title: `Episode ${media.episode} - ${media.title}` || undefined,
				type: 'video'
			}
		}
		this.device.load(encodeURI(this.media.file.url), options, (error,result)=>{
			if (error) return reject(error)
			resolve(result)
		})
		
	})
}

UPNP.prototype.pause = function(){
	try {
		this.device.pause()
	} catch(e){
		if (e) console.error(e.message)
	}	
}
UPNP.prototype.play = function(){
	try {
		this.device.play()
	} catch(e){
		if (e) console.error(e.message)
	}
}
UPNP.prototype.seek = function(seconds=0){
	try {
		this.device.seek(seconds)
	} catch(e){
		if (e) console.error(e.message)
	}
}
UPNP.prototype.stop = function(){
	try {
		this.device.stop()
	} catch(e){
		if (e) console.error(e.message)
	}
}

module.exports = new UPNP()
