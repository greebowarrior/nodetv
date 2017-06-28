"use strict"

angular.module('nutv', ['nutv.core','nutv.shows','nutv.movies','nutv.users'])
	
	.config(['$stateProvider','$urlRouterProvider',($stateProvider,$urlRouterProvider)=>{
		$urlRouterProvider.when('/', $state=>{
			$state.transitionTo('dashboard.home')
		}).otherwise('/')
		
		$stateProvider
			.state('login', {
				url: '/login',
				component: 'nutvLogin',
				breadcrumb: {
					title: 'Login'
				}
			})
			.state('logout', {
				url: '/logout',
				component: 'nutvLogout'
			})
			.state('dashboard', {
				url: '/dashboard',
				abstract: true,
				template: '<ui-view/>'
			})
			.state('dashboard.home', {
				url: '/',
				component: 'nutvDashboard'
			})
	}])
	
	.component('nutvAlerts', {
		templateUrl: '/views/components/alerts.html',
		controller: ['alertService', function(alertService){
			this.alerts = alertService.alerts
			this.alertClose = alertService.close
		}]
	})
	.component('nutvLogin', {
		templateUrl: 'views/auth/login.html',
		controller: ['$http','$localStorage','$log','$state','alertService',function($http,$localStorage,$log,$state,alertService){
			this.auth = {}
			
			this.login = ()=>{
				$http.post('/auth/login', this.auth)
					.then(response=>{
						$localStorage.token = response.data
						$state.go('dashboard.home')
					})
					.catch(()=>{
						alertService.notify({type:'danger',msg:'Incorrect username/password'})
						$log.warn('Authentication error')
					})
			}
		}]
	})
	.component('nutvLogout', {
		templateUrl: 'views/auth/logout.html',
		controller: ['$http','$localStorage','$log','$state',function($http,$localStorage,$log,$state){
			$http.get('/auth/logout')
				.then(()=>{
					delete $localStorage.token
					$state.go('dashboard.home')
				})
				.catch(()=>{
					$log.debug('Error while logging out')
				})
		}]
	})
	
	.component('nutvNavigation', {
		templateUrl: '/views/components/navigation.html',
		controller: ['$localStorage','$log','$socket','$rootScope','$transitions',function($localStorage,$log,$socket,$rootScope,$transitions){
			this.authenticated - false
			this.collapsed = true
			
			$transitions.onStart({}, ()=>{
				this.collapsed = true
			})
			
			$socket.on('error',error=>{
				$log.error(error)
			})
			$socket.on('connect', ()=>{
				if ($localStorage.token) $socket.emit('authenticate', $localStorage.token)
			})
			
			$rootScope.$watch(()=>$localStorage.token, (current)=>{
				this.authenticated = current && current.token ? true : false
			
				$socket.emit('authenticate', $localStorage.token, ()=>{
					console.debug('Socket authenticated')
				})
			}, true)
		}]
	})

	.component('nutvDashboard', {
		templateUrl: '/views/dashboard/index.html',
		controller: ['$http',function($http){
			
			this.episodes = {
				recent: [], upcoming: []
			}
			this.count = {
				recent: null, upcoming: null
			}
			
			/*
			$http.get('/api/shows/ondeck')
				.then(res=>{
					this.deck = res.data.shows
				})
			*/
			$http.get('/api/shows/latest')
				.then(response=>{
					this.episodes.recent = response.data
					this.episodes.recent.forEach(show=>{
						this.count.recent += show.episodes.length
					})
				})
				.catch(()=>{
				//	$log.error(error.message)
				})
			
			$http.get('/api/shows/upcoming')
				.then(response=>{
					this.episodes.upcoming = response.data
					this.episodes.upcoming.forEach(show=>{
						this.count.upcoming += show.episodes.length
					})
				})
				.catch(()=>{
				//	$log.error(error.message)
				})

			
		}]
	})
	
	.controller('NavigationCtrl', ['$interval','$localStorage','$log','$scope','$socket','$transitions',($interval,$localStorage,$log,$scope,$socket,$transitions)=>{
		$scope.collapsed = true
		$scope.authenticated = false
		
		$scope.$watch(()=>$localStorage.token, (current)=>{
			$scope.authenticated = current && current.token ? true : false
			
			$socket.emit('authenticate', $localStorage.token, ()=>{
				console.debug('Socket authenticated')
			})
		},true)
		
		$socket.on('error',error=>{
			$log.error(error)
		})
		
		// Authenticate the socket
		$socket.on('connect', ()=>{
			if ($localStorage.token) $socket.emit('authenticate', $localStorage.token)
		})
		
		$transitions.onStart({}, ()=>{
			$scope.collapsed = true
		})
		
	}])
	