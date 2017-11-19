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
		controller: ['$log',function($log){
			this.$onInit = ()=>{
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
				
				this.background = `background-image: url("/media/${this.type}s/${directory}/${this.item.images.background.files[0].filename}")`
				
				$log.debug(this.background)
			}
		}]
	})
	
	.component('nutvArtwork', {
		// component for displaying artwork
		templateUrl: '/views/components/poster.html',
		bindings: {item:'<', type:'<'},
		controller: ['$log',function($log){
			this.sources = {banner:[`/static/gfx/default-banner.png 800w`],poster:[`/static/gfx/default-cover.png 250w`]}
			
			this.$onInit = ()=>{
				this.title = {banner:true,poster:true,text:this.item.title}
				
				try {
					let directory = this.item.config.directory.replace(/\s/g,'%20').replace(':','\\')
					
					if (this.item.images.banner.enabled){
						if (this.item.images.banner.files.length){
							this.sources.banner = []
							this.item.images.banner.files.forEach(file=>{
								if (file.width > 800) return
								this.sources.banner.push(`/media/${this.type}s/${directory}/${file.filename} ${file.width}w`)
							})
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
								this.sources.poster.push(`/media/${this.type}s/${directory}/${file.filename} ${file.width}w`)
							})
						}
						this.title.poster = false
					} else {
						this.title.poster = true
					}
					
				} catch(e){
					$log.error(e.message)
				}
			}
		}]
	})