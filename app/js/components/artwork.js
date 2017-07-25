"use strict"

angular.module('nutv.core')
	
	.component('showArtwork', {
		templateUrl: '/views/components/artwork.html',
		bindings: {
			show: '=',
			artwork: '=',
			type: '@'
		},
		controller: ['$http','$log','alertService', function($http,$log,alertService){
			this.save = ()=>{
				$http.post(`/api/shows/${this.show.ids.slug}/artwork`, {url:this.artwork.url,type:this.type})
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
	
	.component('nutvArtwork', {
		// component for displaying artwork
		templateUrl: '/views/components/poster.html',
		bindings: {item:'<', type:'<'},
		controller: ['$timeout',function($timeout){
			let sources = []
			this.title = {banner:false,poster:false,text:null}
			
			$timeout(()=>{
				let directory = this.item.config.directory.replace(/\s/g,'%20')
				
				if (this.item.images.banner.enabled){
					sources.push(`/media/${this.type}s/${directory}/${this.item.images.banner.filename} 992w`)
				} else {
					sources.push(`/static/gfx/default-banner.png 992w`)
					this.title.text = this.item.title
					this.title.banner = true
				}
				
				if (this.item.images.poster.enabled){
					sources.push(`/media/${this.type}s/${directory}/${this.item.images.poster.filename} 132w`)
				} else {
					sources.push(`/static/gfx/default-cover.png 132w`)
					this.title.text = this.item.title
					this.title.poster = true
				}
				
				this.srcset = sources.join(', ')
			},0)
			
		}]
	})