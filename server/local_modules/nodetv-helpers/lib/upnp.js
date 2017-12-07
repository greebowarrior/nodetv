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
	let searchType = 'urn:schemas-upnp-org:device:MediaRenderer:1'
	
	this.devices = []
	
	ssdp.on('response', (headers)=>{
		let device = new (require('upnp-device-client'))(headers.LOCATION)
		
		device.getDeviceDescription((error,desc)=>{
			if (error) console.error(error.message)
			if (desc){
				if (desc.deviceType != searchType) return
				
				let obj = {
					name: desc.friendlyName,
					type: desc.deviceType,
					udn: desc.UDN,
					url: headers.LOCATION
				}
				
				let idx = this.devices.findIndex(item=>item.udn==obj.udn)
				
				if (idx >= 0){
					this.devices[idx] = obj
				} else {
					this.devices.push(obj)
				}
			}
		})
	})
	
	ssdp.search(searchType)
	
	return new Promise((resolve)=>{
		setTimeout(()=>{
			resolve(this.devices)
		},2500)
	})
}
UPNP.prototype.setDevice = function(url){
	/*
	return new Promise((resolve,reject)=>{
		try {
			this.device = new UMRC(url)
			
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
	*/
	return new Promise(resolve=>{
		const device = new Device(url)
		resolve(device)
	})
}

/*
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
			console.debug('result', result)
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
*/

/************************************************/

const Device = function(url){
	this.device = new UMRC(url)
	
	this.device.on('error', (error)=>{
		if (error) console.error(error.message)
	})
}

Device.prototype.load = function(media={}){
	return new Promise((resolve,reject)=>{
		if (!media.url) return reject(new Error(`No filedata supplied`))
		let options = { 
			autoplay: true,
			metadata: {
				title: media.title,
				type: 'video'
			}
		}
		this.device.load(encodeURI(media.url), options, (error)=>{
			if (error) return reject(error)
			resolve(this.device)
		})
	})
}

/*
Device.prototype.pause = function(){
	try {
		this.device.pause()
	} catch(e){
		if (e) console.error(e.message)
	}	
}
Device.prototype.play = function(){
	try {
		this.device.play()
	} catch(e){
		if (e) console.error(e.message)
	}
}
Device.prototype.seek = function(seconds=0){
	try {
		this.device.seek(seconds)
	} catch(e){
		if (e) console.error(e.message)
	}
}
Device.prototype.stop = function(){
	try {
		this.device.stop(()=>{
			this.device = undefined
		})
	} catch(e){
		if (e) console.error(e.message)
	}
}
*/

module.exports = new UPNP()
