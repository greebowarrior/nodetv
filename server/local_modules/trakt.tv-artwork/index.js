"use strict"

let Artwork = function(){
	this.trakt = null
	this.options = {}
}

Artwork.prototype.init = function(trakt,options){
	this.trakt = trakt
	this.options = options
}
Artwork.prototype.prune = function(input,limit=12){
	let list = []
	
	list = (input || []).filter(item=>{
		return item.lang === 'en' || item.lang === ''
	})
	
	list.sort((a,b)=>{
		if (a.likes < b.likes) return 1
		if (a.likes > b.likes) return -1
		return 0
	})
	return list.map(item=>{
		item.url = item.url.replace(/^http:/, 'https:')
		item.preview = item.url.replace(/\/fanart\//,'/preview/')
		return item
	}).slice(0, limit)
}
Artwork.prototype.get = function(ids,type='show'){
	return new Promise((resolve,reject)=>{
		
		let api_url = null
		switch (type){
			case 'show':
				api_url = `https://webservice.fanart.tv/v3/tv/${ids.tvdb}`
				break
			case 'movie':
				api_url = `https://webservice.fanart.tv/v3/movies/${ids.tmdb}`
				break
		}
		
		require('request').get({
			url: `${api_url}?api_key=${this.options.apikey}`,
			json: true
		}, (error,res,body)=>{
			if (error || body.status == 'error') return reject()
			if (body){
				let response = {
					banners: this.prune(body.tvbanner || body.moviebanner),
					backgrounds: this.prune(body.showbackground || body.moviebackground),
					posters: this.prune(body.tvposter || body.movieposter)
				}
				resolve(response)
			}
		})
	})
}

module.exports = new Artwork()