"use strict"

angular.module('nutv.users', ['nutv.core'])
	
	.factory('userService', ['$http',($http)=>{
		const Users = function(){
			this.api = '/api/users'
			return this
		}
		
		Users.prototype.add = function(user){
			return $http.post(this.api, user)
		}
		Users.prototype.delete = function(id){
			return $http.delete(`${this.api}/${id}`)
		}
		Users.prototype.get = function(id){
			return $http.get(`${this.api}/${id}`)
				.then(res=>res.data)
		}
		Users.prototype.list = function(){
			return $http.get(this.api)
				.then(res=>res.data)
		}
		Users.prototype.update = function(user){
			return $http.post(`${this.api}/${user._id}`, user)
				.then(res=>res.data)
		}
		return new Users()
	}])
	.config(['$stateProvider',($stateProvider)=>{
		$stateProvider
			.state('users', {
				abstract: true,
				url: '/users',
				template: '<ui-view />',
				breadcrumb: {
					title: 'Users',
					state: 'users.list'
				}
			})
			.state('users.list', {
				redirectTo: 'users.index'
			})
			.state('users.index',{
				url: '/',
				component: 'users',
				resolve: {
					users: (userService)=>userService.list()
				}
			})
			.state('users.add', {
				url: '/add',
				component: 'user',
				resolve: {
					user: ()=>{return {new:true}}
				},
				breadcrumb: {
					title: 'Add User'
				}
			})
			.state('users.profile', {
				url: '/me',
				component: 'user',
				resolve: {
					user: ($stateParams,userService)=>userService.get('me')
				},
				breadcrumb: {
					title: 'Me'
				}
			})
			.state('users.user', {
				url: '/:id',
				component: 'user',
				resolve: {
					user: ($stateParams,userService)=>userService.get($stateParams.id)
				},
				breadcrumb: {
					title: '{{user.username}}'
				}
			})
	}])
	
	.component('users', {
		bindings: {users: '='},
		templateUrl: '/views/user/list.html',
		controller: function(){
			
		}
	})
	.component('user', {
		templateUrl: '/views/user/index.html',
		bindings: {
			user: '='
		},
		controller: ['$http','$log','$state','alertService','userService',function($http,$log,$state,alertService,userService){
			this.delete = ()=>{
				
				alertService.confirm({
					title: 'Are you sure?',
					msg: 'Your will not be able to recover this user!',
					type: 'warning'
				}).then(confirmed=>{
					if (confirmed){
						$log.debug(confirmed)
						/*
						userService.delete(this.user._id)
							.then(()=>{
								alertService.alert({type:'success',title:`User '${this.user.username}' deleted`})
								$state.go('^.list')
							})
						*/
					}
				})
			}

			this.sync = ()=>{
				alertService.confirm({
					title: 'Are you sure?',
					msg: 'Sync all shows from Trakt.tv? This may take a while',
					type: 'Question'
				}).then(confirmed=>{
					if (confirmed){
						$http.post(`/api/users/${this.user._id}/sync`)
							.then(()=>{
								alertService.notify({type:'info',msg:`Sync in progress`})
							})
					}
				})
			}
			
			this.save = ()=>{
				new Promise(resolve=>{
					if (this.user._id){
						resolve(userService.update(this.user))
					} else {
						resolve(resolve(userService.add(this.user)))
					}
				}).then(user=>{
					if (this.user.new){
						alertService.alert({type:'success',title:`User Added`})
						$state.go('^.detail',{id:user._id})
					} else {
						alertService.notify({type:'success',msg:`User '${this.user.username}' updated`})
					}
					//$state.go('^.list')
				})
				.catch(()=>{
					
				})
			}
		}]
	})
	
	.component('traktAuth', {
		templateUrl: '/views/auth/trakt.html',
		bindings: {
			user: '='
		},
		controller: ['$http','$socket','$timeout','alertService',function($http,$socket,$timeout,alertService){
			this.disconnect = ()=>{
				alertService.confirm({
					title: 'Disconnect Trakt.tv?',
					type: 'Question',
					msg: 'Are you sure you want to disconnect from Trakt.tv?'
				})
				.then(()=>{
					return $http.delete('/api/trakt/auth', {params:{id:this.user._id}})
				})
				.then(()=>{
					this.user.profile = undefined
					this.connect()
				})
				.catch(error=>{
					console.error(error)
				})
			}
			
			// TODO: stop listening on statechange start
			$socket.on('trakt.connected', (profile)=>{
				if (profile) this.user.profile = profile
				if (!profile) this.connect()
			})
			
			this.connect = ()=>{
				$http.post('/api/trakt/auth', {id:this.user._id})
					.then(res=>{
						if (res.data.username) {
							this.user.profile = res.data
						} else {
							this.trakt = res.data
						}
					})
			}
			
			$timeout(()=>{
				if (this.user._id) this.connect()
			},0)
		}]
	})