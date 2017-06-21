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
		Users.prototype.update = function(id){
			return $http.post(`${this.api}/${id}`)
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
		controller: ['$log','$state','alertService','userService',function($log,$state,alertService,userService){
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
			
			this.save = ()=>{
				userService.update(this.user._id)
					.then(()=>{
						alertService.notify({type:'success',msg:`User '${this.user.username}' updated`})
						$state.go('^.list')
					})
			}
		}]
	})
	
	.component('traktAuth', {
		templateUrl: '/views/auth/trakt.html',
		controller: ['$http','$socket','alertService',function($http,$socket,alertService){
			this.disconnect = ()=>{
				alertService.confirm({
					title: 'Disconnect Trakt.tv?',
					type: 'Question',
					msg: 'Are you sure you want to disconnect from Trakt.tv?'
				}).then(()=>{
					$http.delete('/api/trakt/auth')
					.then(()=>{
						this.trakt = undefined
					})
				})
			}
			
			// TODO: stop listening on statechange start
			$socket.on('trakt.connected', (status)=>{
				this.trakt.connected = status
				if (!status) this.connect()
			})
			
			this.connect = ()=>{
				$http.get('/api/trakt/auth')
					.then(res=>{
						this.trakt = res.data
					})
			}
			this.connect()
		}]
	})