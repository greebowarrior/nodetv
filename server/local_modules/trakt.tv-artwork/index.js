"use strict"

let Artwork = function(){
	this.trakt = null
	this.options = {}
}

Artwork.prototype.init = function(trakt,options){
	this.trakt = trakt
	this.options = options
}

Artwork.prototype.prune = function(input){
	let list = []
	
	list = (input || []).filter(item=>{
		return (item.lang === 'en' || item.lang === '') // && item.likes > 0
	})
	
	list.sort((a,b)=>{
		if (a.likes < b.likes) return 1
		if (a.likes > b.likes) return -1
		return 0
	})
	return list.map(item=>{
		item.url = item.url.replace(/^http:/, 'https:')
		//.replace(/\/fanart\//,'/preview/')
		return item
	}).slice(0,10)
	
//	return list.slice(0,10)
}

Artwork.prototype.get = function(ids){
	return new Promise((resolve,reject)=>{
		
		console.log(ids)
		
		require('request').get({
			url: `https://webservice.fanart.tv/v3/tv/${ids.tvdb}?api_key=${this.options.apikey}`,
			json: true
		}, (error,res,body)=>{
			if (error || body.status == 'error') return reject()
			if (body){
				let response = {
					banners: this.prune(body.tvbanner),
					backgrounds: this.prune(body.showbackground),
					posters: this.prune(body.tvposter)
				}
				resolve(response)
			}
		})
	})
}

module.exports = new Artwork()