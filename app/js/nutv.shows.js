"use strict"

angular.module('nutv.shows', ['nutv.core'])

	.factory('showService', ['$http',($http)=>{
		const Shows = function(){
			this.api = '/api/shows'
			return this
		}
		
		Shows.prototype.add = function(show){
			return $http.post(this.api, show)
		}
		Shows.prototype.delete = function(id){
			return $http.delete(`${this.api}/${id}`)
		}
		Shows.prototype.get = function(id){
			return $http.get(`${this.api}/${id}`)
				.then(res=>res.data)
		}
		Shows.prototype.list = function(){
			return $http.get(this.api)
				.then(res=>res.data)
		}
		Shows.prototype.update = function(id){
			return $http.post(`${this.api}/${id}`)
				.then(res=>res.data)
		}
		
		Shows.prototype.season = function(slug,season){
			return $http.get(`/api/shows/${slug}/seasons/${season}`)
				.then(res=>res.data)
		}
		Shows.prototype.episodes = function(slug,season){
			return $http.get(`/api/shows/${slug}/seasons/${season}/episodes`)
				.then(res=>res.data)
		}
		Shows.prototype.episodes = function(slug,season){
			return $http.get(`/api/shows/${slug}/seasons/${season}/episodes`)
				.then(res=>res.data)
		}
		
		return new Shows()
	}])
	
	.config(['$stateProvider',($stateProvider)=>{
		$stateProvider
			.state('shows', {
				abstract: true,
				url: '/shows',
				template: '<ui-view />',
				redirectTo: 'shows.index',
				breadcrumb: {
					title: 'Shows'
				}
			})
			.state('shows.index', {
				url: '/?page',
				component: 'nutvGrid',
				params: {
					page: {
						value: '1',
						squash: true,
						dynamic: true
					}
				},
				reloadOnSearch: false,
				resolve: {
					list: (showService)=>showService.list(),
					page: ['$stateParams',(p)=>p.page],
					type: ()=>'show'
				}
			})
			.state('shows.detail', {
				url: '/:slug',
				component: 'nutvShow',
				resolve: {
					show: ($stateParams,showService)=>showService.get($stateParams.slug)
				},
				breadcrumb: {
					title: '{{show.title}}'
				}
			})
			.state('shows.detail.season', {
				url: '/seasons/:season',
				component: 'nutvShowSeason',
				resolve: {
					episodes: ($stateParams,showService)=>showService.episodes($stateParams.slug,$stateParams.season),
					season: ($stateParams,showService)=>showService.season($stateParams.slug,$stateParams.season),
					show: ($stateParams,showService)=>showService.get($stateParams.slug)
				}
			})
	}])
	
	.component('nutvShow', {
		bindings:{show:'='},
		templateUrl: '/views/show/show.html',
		controller: ['$http','$log','$state','$timeout','alertService',function($http,$log,$state,$timeout,alertService){
			this.images = []
			this.qualities = ['1080p','720p','SD']
			
			$timeout(()=>{
				if (!this.show.config.feed.length) this.show.config.feed = [{url:''}]
			},0)
			
			this.save = ()=>{
				$http.patch(`${this.show.uri}`, {config:this.show.config})
					.then(()=>{
						alertService.notify({type:'success',msg:`Show updated: '${this.show.title}'`})
					})
					.catch(error=>{
						alertService.notify({type:'danger',msg:`Unable to update '${this.show.title}'`})
						$log.error(error)
					})
			}
			
			this.feeds = ()=>{
				$http.patch(`${this.show.uri}/feeds`)
					.then(()=>{
						alertService.notify({type:'success',msg:`Feeds updated for '${this.show.title}'`})
					})
					.catch(error=>{
						$log.error(error)
					})
			}
			this.getArtwork = ()=>{
				$http.get(`${this.show.uri}/artwork`)
					.then(response=>{
						this.images = response.data
					})
					.catch(error=>{
						alertService.notify({type:'warning',msg:`Unable to find artwork for '${this.show.title}'`})
						if (error) $log.error(error)
					})
			}
			this.getDirectories = ()=>{
				$http.get(`${this.show.uri}/match`)
					.then(response=>{
						this.matches = response.data
					})
			}
			
			this.rescan = ()=>{
				alertService.confirm({
					title: 'Rescan Directory',
					type: 'Question',
					msg: 'Are you sure? This may take a while.'
				}).then(()=>{
					$http.post(`${this.show.uri}/scan`)
				})
			}
			
			this.remove = ()=>{
				alertService.confirm({
					title: 'Remove show',
					type: 'warning',
					msg: 'Are you sure?'
				}).then(()=>{
					$http.delete(`${this.show.uri}`)
						.then(()=>{
							$state.go('shows.index')
						})
				})
			}
			
			this.sync = ()=>{
				alertService.confirm({
					title: 'Sync show data',
					type: 'Question',
					msg: 'Are you sure? This may take a while.'
				}).then(()=>{
					$http.post(`${this.show.uri}/sync`)
				})
			}
		}]
	})
	
	.component('nutvShowSeason', {
		bindings: {
			episodes: '<',
			season: '<',
			show: '<'
		},
		templateUrl: '/views/show/season.html'
	})
	.component('nutvShowEpisode', {
		bindings: {episode:'=',show:'<'},
		templateUrl: '/views/show/episode.html',
		controller: ['$http','$log','$uibModal','alertService',function($http,$log,$uibModal,alertService){
			this.download = ()=>{
				$uibModal.open({
					component: 'nutvShowDownload',
					resolve: {
						show: ()=>this.show,
						episode: ()=>this.episode
					}
				}).result.then(result=>{
					$http.post(`${this.show.uri}/seasons/${this.episode.season}/episodes/${this.episode.episode}/download`, {hash:result})
						.then(()=>{
							alertService.alert({
								title: 'Download started',
								type: 'success'
							})
						})
				})
				.catch(()=>{
					console.debug('No download selected')
				})
			}
			this.play = ()=>{
				$uibModal.open({
					component: 'nutvUpnpDevice'
				}).result.then(device=>{
					return $http.post(`${this.show.uri}/seasons/${this.episode.season}/episodes/${this.episode.episode}/play`, {device:device})
				}).catch(()=>{
					$log.debug('Play aborted')
				})
			}
			
			this.watched = ()=>{
				$http.post(`${this.show.uri}/seasons/${this.episode.season}/episodes/${this.episode.episode}/watched`)
					.then(()=>{
						alertService.alert({
							title: 'Episode watched',
							msg: `${this.episode.title}`,
							type: 'success'
						})
					})
			}
		}]
	})
	
	.component('nutvShowDownload', {
		templateUrl: '/views/show/download.html',
		bindings: {
			resolve: '<',
			close: '&',
			dismiss: '&'
		},
		controller: [function(){
			this.$onInit = ()=>{
				this.selected = false
				
				this.show = this.resolve.show
				this.episode = this.resolve.episode
				
				this.episode.hashes.sort((a,b)=>{
					if (a.quality == b.quality){
						if (a.repack && !b.repack) return -1
						if (!a.repack && b.repack) return 1
						return 0
					}
					if (a.quality == '1080p' && b.quality != '1080p') return -1
					if (a.quality == '720p'){
						if (b.quality == '1080p') return 1
						if (b.quality == 'SD') return -1
					}
					if (a.quality == 'SD') return 1
					return 0
				})
			}
			this.select = (hash)=>{
				this.selected = hash
			}
			this.download = ()=>{
				this.close({$value:this.selected.btih})
			}
			this.cancel = ()=>{
				this.dismiss({$value:'cancel'})
			}
		}]
	})
	
