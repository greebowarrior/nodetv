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
					season: ($stateParams,showService)=>showService.season($stateParams.slug,$stateParams.season)
				}
			})
	}])
	
	.component('nutvShow', {
		bindings:{show:'='},
		templateUrl: '/views/show/show.html',
		controller: ['$http','$log','alertService',function($http,$log,alertService){
			this.images = []
			
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
		}]
	})
	.component('nutvShowSeason', {
		bindings: {
			episodes: '=',
			season: '='
		},
		templateUrl: '/views/show/season.html',
		controller: [function(){
			/*
			$http.get(`/api/shows/${$stateParams.slug}/seasons/${$stateParams.season}`)
			.then(season=>{
				$scope.season = season.data
				return $http.get(`/api/shows/${$stateParams.slug}/seasons/${$stateParams.season}/episodes`)
			})
			.then(episodes=>{
				$scope.episodes = episodes.data
			})
			.catch(error=>{
				if (error) $log.error(error)
			})
			*/
		}]
	})
	.component('nutvShowEpisode', {
		bindings: {episode:'='},
		templateUrl: '/views/show/episode.html',
		controller: ['$http','$log',function($http,$log){
			this.download = ()=>{
				$log.debug('download episode')
			}
			this.watched = ()=>{
				$log.debug('set watched')
			}
		}]
	})

	
	
	
	
	/*
	.controller('ShowCtrl', ['$http','$log','$scope','$state','$stateParams','alertService',function($http,$log,$scope,$state,$stateParams,alertService){
		$scope.show = {}
		$scope.images = []
		
		$scope.save = ()=>{
			$http.patch(`/api/shows/${$scope.show.ids.slug}`, {config:$scope.show.config})
				.then(()=>{
					alertService.notify({type:'success',msg:`Show updated: '${$scope.show.title}'`})
				})
				.catch(error=>{
					alertService.notify({type:'danger',msg:`Unable to update '${$scope.show.title}'`})
					$log.error(error)
				})
		}
		
		$scope.match = ()=>{
			$http.get(`/api/shows/${$stateParams.slug}/match`)
				.then(res=>{
					this.config.directory = res.data.directory
				})
				.catch(error=>{
					$log.error(error)
				})
		}
		
		$scope.getArtwork = ()=>{
			$http.get(`/api/shows/${$stateParams.slug}/artwork`)
				.then(response=>{
					$scope.images = response.data
				})
				.catch(error=>{
					if (error) $log.error(error)
				})
		}
		
		if ($stateParams.slug){
			$http.get(`/api/shows/${$stateParams.slug}`)
				.then(response=>{
					$scope.show = response.data
				//	crumbService.current({title:response.data.title})
					
					if (!$scope.show.config.feed.length) $scope.show.config.feed.push({url:''})
				})
				.catch(error=>{
					if (error) $log.error(error.message)
				})
		}
		
		$scope.setArtwork = (type)=>{
			$http.post(`/api/shows/${$stateParams.slug}/artwork/${type}`)
				.then(()=>{
					alertService.notify({type:'success',msg:`${$scope.show.title} updated`})
				})
				.catch(()=>{
					alertService.notify({type:'danger',msg:`${$scope.show.title} was not updated`})
				})
		}
		
	}])
	.controller('SeasonCtrl', ['$http','$log','$scope','$stateParams',function($http,$log,$scope,$stateParams){
		$scope.season = {}
		
		$http.get(`/api/shows/${$stateParams.slug}/seasons/${$stateParams.season}`)
			.then(season=>{
				$scope.season = season.data
				return $http.get(`/api/shows/${$stateParams.slug}/seasons/${$stateParams.season}/episodes`)
			})
			.then(episodes=>{
				$scope.episodes = episodes.data
			})
			.catch(error=>{
				if (error) $log.error(error)
			})
	}])
	*/