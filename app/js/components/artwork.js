"use strict"

angular.module('nutv.core')
	
	.component('showArtwork', {
		// Component for downloading artwork
		templateUrl: '/views/components/artwork.html',
		bindings: {
			artwork: '<',
			show: '<',
			type: '@'
		},
		controller: ['$http','$log','alertService', function($http,$log,alertService){
			this.save = ()=>{
				$http.post(`${this.show.uri}/artwork`, {preview:this.artwork.preview,url:this.artwork.url,type:this.type})
					.then(res=>{
						alertService.notify({type:'success',msg:'Artwork saved'})
						$log.debug(res.data)
					})
					.catch(error=>{
						alertService.notify({type:'danger',msg:'Unable to save artwork'})
						if (error) $log.error(error)
					})
			}
		}]
	})
	
	
	.component('nutvArtwork', {
		// component for displaying artwork
		templateUrl: '/views/components/poster.html',
		bindings: {item:'<'},
		controller: [function(){
			this.$onInit = ()=>{
				this.sources = {banner:[`/static/gfx/default-banner.png 800w`],poster:[`/static/gfx/default-cover.png 250w`]}
				
				this.title = {banner:true,poster:true,text:this.item.title}
				
				if (this.item.images.banner.enabled){
					if (this.item.images.banner.files.length){
						this.sources.banner = []
						this.item.images.banner.files.forEach(file=>{
							if (file.width > 800) return
							this.sources.banner.push(`${this.item.images.baseUrl}/${file.filename} ${file.width}w`)
						})
					//	this.sources.banner.push('/static/gfx/default-banner.png')
					}
					this.title.banner = false
				} else {
					this.title.banner = true
				}
				
				if (this.item.images.poster.enabled){
					if (this.item.images.poster.files.length){
						this.sources.poster = []
						this.item.images.poster.files.forEach(file=>{
							if (file.width > 800) return
							this.sources.poster.push(`${this.item.images.baseUrl}/${file.filename} ${file.width}w`)
						})
					//	this.sources.poster.push('/static/gfx/default-cover.png')
					}
					this.title.poster = false
				} else {
					this.title.poster = true
				}
			}
		}]
	})
	.component('nutvBanner', {
		templateUrl: '/views/components/banner.html',
		bindings: {item:'<'},
		controller: [function(){
			this.$onInit = ()=>{
				let sources = []
				
				if (this.item.images.banner.files.length){
					this.item.images.banner.files.forEach(file=>{
						sources.push(`${this.item.images.baseUrl}/${file.filename} ${file.width}w`)
					})
				} else if (this.item.images.banner.filename){
					sources.push(`${this.item.images.baseUrl}/${this.item.images.banner.filename} 800w`)
				}
				this.srcset = sources.join(', ')
				
				if (this.item.images.background.enabled){
					this.background = `background-image: url("${this.item.images.baseUrl}/${this.item.images.background.files[0].filename}")`
				}
			}
		}]
	})
	
	.component('nutvGetArtwork', {
		// Component for downloading artwork 
		templateUrl: '/views/components/artwork.html',
		bindings: {
			artwork: '<',
			item: '<',
			type: '@'
		},
		controller: ['$http','$log','alertService', function($http,$log,alertService){
			this.save = ()=>{
				$http.post(`${this.item.uri}/artwork`, {preview:this.artwork.preview,url:this.artwork.url,type:this.type})
					.then(res=>{
						alertService.notify({type:'success',msg:'Artwork saved'})
						$log.debug(res.data)
					})
					.catch(error=>{
						alertService.notify({type:'danger',msg:'Unable to save artwork'})
						if (error) $log.error(error)
					})
			}
		}]
	})
