"use strict"

angular.module('nutv.core')
	
	.component('showArtwork', {
		// Component for downloading artwork
		templateUrl: '/views/components/artwork.html',
		bindings: {
			show: '=',
			artwork: '=',
			type: '@'
		},
		controller: ['$http','$log','alertService', function($http,$log,alertService){
			this.save = ()=>{
				$http.post(`/api/shows/${this.show.ids.slug}/artwork`, {preview:this.artwork.preview,url:this.artwork.url,type:this.type})
					.then(res=>{
						alertService.notify({type:'success',msg:'Artwork saved'})
						$log.debug(res.data)
					})
					.catch(error=>{
						alertService.notify({type:'danger',msg:'Unable to save artwork'})
						$log.error(error)
					})
			}
		}]
	})
	
	.component('nutvBanner', {
		templateUrl: '/views/components/banner.html',
		bindings: {item:'<', type:'@'},
		controller: ['$log','$timeout',function($log,$timeout){
			$timeout(()=>{
				let sources = []
				let directory = this.item.config.directory.replace(/\s/g,'%20')
				
				if (this.item.images.banner.files.length){
					this.item.images.banner.files.forEach(file=>{
						sources.push(`/media/${this.type}s/${directory}/${file.filename} ${file.width}w`)
					})
				} else if (this.item.images.banner.filename){
					sources.push(`/media/${this.type}s/${directory}/${this.item.images.banner.filename} 800w`)
				}
				this.srcset = sources.join(', ')
			},0)
		}]
	})
	
	.component('nutvArtwork', {
		// component for displaying artwork
		templateUrl: '/views/components/poster.html',
		bindings: {item:'<', type:'<'},
		controller: ['$log','$timeout',function($log,$timeout){
			let sources = []
			this.title = {banner:false,poster:false,text:null}
			
			$timeout(()=>{
				let directory = this.item.config.directory.replace(/\s/g,'%20')
				
				if (this.item.images.banner.enabled){
					if (this.item.images.banner.files.length){
						this.item.images.banner.files.forEach(file=>{
							sources.push(`/media/${this.type}s/${directory}/${file.filename} ${file.width}w`)
						})
					} else {
						sources.push(`/media/${this.type}s/${directory}/${this.item.images.banner.filename} 800w`)
					}
				} else {
					sources.push(`/static/gfx/default-banner.png 800w`)
					this.title.text = this.item.title
					this.title.banner = true
				}
				
				if (this.item.images.poster.enabled){
					if (this.item.images.poster.files.length){
						this.item.images.poster.files.forEach(file=>{
							sources.push(`/media/${this.type}s/${directory}/${file.filename} ${file.width}w`)
						})
					} else {
						sources.push(`/media/${this.type}s/${directory}/${this.item.images.poster.filename} 250w`)
					}
				} else {
					sources.push(`/static/gfx/default-cover.png 250w`)
					this.title.text = this.item.title
					this.title.poster = true
				}
				
				this.srcset = sources.join(', ')
			},0)
			
		}]
	})