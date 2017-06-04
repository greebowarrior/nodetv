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