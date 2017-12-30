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
					list: (movieService)=>movieService.list(),
					page: ['$stateParams',(p)=>p.page],
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
		bindings: {movie: '<'},
		templateUrl: '/views/movie/movie.html',
		controller: ['$http','$log','$uibModal','alertService', function($http,$log,$uibModal,alertService){
			this.$onInit = ()=>{
				this.images = []
			}
			
			this.download = (btih)=>{
				$http.post(`${this.movie.uri}/download`, {hash:btih}).then(()=>{
					alertService.alert({type:'success',title:`Download started: '${this.movie.title}'`})
				})
				.catch(error=>{
					alertService.notify({type:'danger',msg:`Unable to download '${this.movie.title}'`})
					$log.error(error)
				})
			}
			
			this.getArtwork = ()=>{
				$http.get(`${this.movie.uri}/artwork`).then(res=>{
					this.images = res.data
				})
				.catch(error=>{
					alertService.notify({type:'warning',msg:`Unable to find artwork for '${this.movie.title}'`})
					if (error) $log.error(error)
				})
			}
			this.getDownloads = ()=>{
				$http.patch(`${this.movie.uri}/feeds`).then(res=>{
					this.movie.hashes = res.data
				})
			}
			
			this.play = ()=>{
				$uibModal.open({
					component: 'nutvUpnpDevice'
				}).result.then(device=>{
					return $http.post(`${this.movie.uri}/play`, {device:device})
				}).catch(()=>{
					$log.debug('Play aborted')
				})
			}
			
			this.save = ()=>{
				$http.patch(`${this.movie.uri}`, {config:this.movie.config})
					.then(()=>{
						alertService.notify({type:'success',msg:`Mmvie updated: '${this.movie.title}'`})
					})
					.catch(error=>{
						alertService.notify({type:'danger',msg:`Unable to update '${this.movie.title}'`})
						$log.error(error)
					})
			}
			this.sync = ()=>{
				alertService.confirm({
					title: 'Sync movie data?',
					type: 'Question'
				}).then(()=>{
					$http.post(`${this.movie.uri}/sync`).then(res=>{
						this.movie = res.data
					})
				})
			}
		}]
	})