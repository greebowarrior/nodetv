"use strict"

angular.module('nutv.movies', ['nutv.core'])

	.factory('movieService', ['$http',($http)=>{
		const Movies = function(){
			this.api = '/api/movies'
			return this
		}
		
		Movies.prototype.add = function(show){
			return $http.post(this.api, show)
		}
		Movies.prototype.delete = function(id){
			return $http.delete(`${this.api}/${id}`)
		}
		Movies.prototype.get = function(id){
			return $http.get(`${this.api}/${id}`)
				.then(res=>res.data)
		}
		Movies.prototype.list = function(){
			return $http.get(this.api)
				.then(res=>res.data)
		}
		Movies.prototype.update = function(id){
			return $http.post(`${this.api}/${id}`)
				.then(res=>res.data)
		}
		
		return new Movies()
	}])
	
	.config(['$stateProvider',($stateProvider)=>{
		$stateProvider
			.state('movies', {
				abstract: true,
				url: '/movies',
				template: '<ui-view />',
				redirectTo: 'movies.index',
				breadcrumb: {
					title: 'Movies'
				}
			})
			.state('movies.index', {
				url: '/',
				component: 'nutvGrid',
				resolve: {
					list: (movieService)=>movieService.list(),
					type: ()=>'movie'
				}
			})
			.state('movies.detail', {
				url: '/:slug',
				component: 'nutvMovie',
				resolve: {
					movie: ($stateParams,movieService)=>movieService.get($stateParams.slug)
				},
				breadcrumb: {
					title: '{{movie.title}}'
				}
			})
	}])
	
	.component('nutvMovie', {
		bindings: {movie: '='},
		templateUrl: '/views/movie/movie.html',
		controller: ['$http','$log','alertService',function($http,$log,alertService){
			this.images = []
			
			this.save = ()=>{
				alertService.alert()
			}
			this.getArtwork = ()=>{
				
			}
			this.sync = ()=>{
				
			}
		}]
	})
	
	/*
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
		bindings: {episode:'<',show:'<'},
		templateUrl: '/views/show/episode.html',
		controller: ['$http','$log','alertService',function($http,$log,alertService){
			this.download = ()=>{
				$http.post(`${this.show.uri}/seasons/${this.episode.season}/episodes/${this.episode.episode}/download`)
					.then(()=>{
						$log.debug('derp')
						alertService.alert({
							title: 'Download started',
							type: 'success'
						})
					})
			}
			this.watched = ()=>{
				$log.debug('set watched')
			}
		}]
	})
	*/