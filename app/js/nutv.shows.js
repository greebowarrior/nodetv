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
				url: '/',
				component: 'nutvGrid',
				resolve: {
					list: (showService)=>showService.list(),
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
				$http.patch(`/api/shows/${this.show.ids.slug}`, {config:this.show.config})
					.then(()=>{
						alertService.notify({type:'success',msg:`Show updated: '${this.show.title}'`})
					})
					.catch(error=>{
						alertService.notify({type:'danger',msg:`Unable to update '${this.show.title}'`})
						$log.error(error)
					})
			}
			
			this.feeds = ()=>{
				$http.patch(`/api/shows/${this.show.ids.slug}/feeds`)
					.then(()=>{
						alertService.notify({type:'success',msg:`Feeds updated for '${this.show.title}'`})
					})
					.catch(error=>{
						$log.error(error)
					})
			}
			this.getArtwork = ()=>{
				$http.get(`/api/shows/${this.show.ids.slug}/artwork`)
					.then(response=>{
						this.images = response.data
					})
					.catch(error=>{
						alertService.notify({type:'warning',msg:`Unable to find artwork for '${this.show.title}'`})
						if (error) $log.error(error)
					})
			}
			this.getDirectories = ()=>{
				$http.get(`/api/shows/${this.show.ids.slug}/match`)
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
					$http.post(`/api/shows/${this.show.ids.slug}/scan`)
				})
			}
			
			this.remove = ()=>{
				alertService.confirm({
					title: 'Remove show',
					type: 'warning',
					msg: 'Are you sure?'
				}).then(()=>{
					$http.delete(`/api/shows/${this.show.ids.slug}`)
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
					$http.post(`/api/shows/${this.show.ids.slug}/sync`)
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
		controller: ['$http','$log','alertService',function($http,$log,alertService){
			this.download = ()=>{
				$http.post(`${this.show.uri}/seasons/${this.episode.season}/episodes/${this.episode.episode}/download`)
					.then(()=>{
						alertService.alert({
							title: 'Download started',
							type: 'success'
						})
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
