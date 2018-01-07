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
		controller: ['$http','$log','$state','$uibModal','alertService', function($http,$log,$state,$uibModal,alertService){
			this.$onInit = ()=>{
				this.images = []
			}
			
			this.download = (btih)=>{
				$http.post(`${this.movie.uri}/download`, {hash:btih}).then(()=>{
					alertService.alert({type:'success',title:this.movie.title,text:`Download started`,toast:true})
				}).catch(error=>{
					alertService.alert({type:'error',title:this.movie.title,text:'Unable to download',toast:true})
					$log.error(error)
				})
			}
			
			this.getArtwork = ()=>{
				$http.get(`${this.movie.uri}/artwork`).then(res=>{
					this.images = res.data
				})
				.catch(error=>{
					if (error) $log.error(error)
					alertService.alert({type:'warning',title:this.movie.title,text:'Unable to find artwork',toast:true})
				})
			}
			this.getDownloads = ()=>{
				$http.patch(`${this.movie.uri}/feeds`).then(res=>{
					if (!res.data) throw new Error(`Unable to find downloads`)
					this.movie.hashes = res.data
				})
				.catch(error=>{
					if (error) $log.error(error)
					alertService.alert({type:'warning',title:this.movie.title,text:'Unable to find downloads',toast:true})
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
			this.remove = ()=>{
				alertService.confirm({
					title: 'Remove Movie?',
					type: 'warning',
					text: 'Are you sure you want to remove this from your library?'
				}).then(()=>{
					return $http.delete(`${this.movie.uri}`).then(()=>{
						$state.go('^.index')
					}).catch(()=>{
						alertService.alert({type:'error',title:this.movie.title,text:'Unable to remove',toast:true})
					})
				})
			}
			this.save = ()=>{
				$http.patch(`${this.movie.uri}`, {config:this.movie.config})
					.then(()=>{
						alertService.notify({type:'success',title:this.movie.title,text:'Movie updated'})
					})
					.catch(error=>{
						alertService.notify({type:'danger',title:this.movie.title,text:'Unable to update'})
						$log.error(error)
					})
			}
			this.sync = ()=>{
				alertService.confirm({
					title: 'Sync Movie Data?',
					text: 'Be patient, this may take a while.',
					type: 'question'
				}).then(()=>{
					return $http.post(`${this.movie.uri}/sync`)
				}).then(res=>{
					alertService.alert({type:'success',title:this.movie.title,text:'Movie updated',toast:true})
					this.movie = res.data
				})
			}
		}]
	})