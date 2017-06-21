"use strict"

angular.module('nutv', ['nutv.core','nutv.shows','nutv.users'])
	
	.config(['$stateProvider','$urlRouterProvider',($stateProvider,$urlRouterProvider)=>{
		$urlRouterProvider.when('/', $state=>{
			$state.transitionTo('dashboard.home')
		}).otherwise('/')
		
		$stateProvider
			.state('login', {
				url: '/login',
				component: 'nutvLogin',
				breadcrumb: {
					label: 'Login'
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
				controller: 'DashboardCtrl',
				templateUrl: 'views/dashboard/index.html'
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
		templateUrl: '',
		controller: ['$localStorage','$socket','$transitions',function($localStorage,$socket,$transitions){
			this.authenticated - false
			this.collapsed = true
			$transitions.onStart({}, ()=>{
				this.collapsed = true
			})
		}]
	})
	
	.controller('NavigationCtrl', ['$localStorage','$scope','$socket','$transitions',($localStorage,$scope,$socket,$transitions)=>{
		$scope.collapsed = true
		$scope.authenticated = false
		
		$scope.$watch(()=>$localStorage.token, (current)=>{
			$scope.authenticated = current && current.token ? true : false
		},true)
		
		$transitions.onStart({}, ()=>{
			$scope.collapsed = true
		})
	}])

	.controller('DashboardCtrl', ['$http','$log','$scope',function($http,$log,$scope){
		$scope.episodes = {
			latest: [],
			upcoming: []
		}
		$scope.count = {
			recent: null,
			upcoming: null
		}
		
		$http.get('/api/shows/latest')
			.then(response=>{
				$scope.episodes.latest = response.data
				$scope.episodes.latest.forEach(show=>{
					$scope.count.recent += show.episodes.length
				})
			})
			.catch(()=>{
			//	$log.error(error.message)
			})
			
		$http.get('/api/shows/upcoming')
			.then(response=>{
				$scope.episodes.upcoming = response.data
				$scope.episodes.upcoming.forEach(show=>{
					$scope.count.upcoming += show.episodes.length
				})
			})
			.catch(()=>{
			//	$log.error(error.message)
			})
	}])
	
	.controller('TraktConnectController', ['$http','$log','$scope',($http,$log,$scope)=>{
		$scope.trakt = {
			connected: false,
			url: null,
			pin: null
		}
		
		$http.get('/api/auth/trakt')
			.then(response=>{
				$scope.trakt.url = response.data.url
			})
			.catch(error=>{
				$log.error(error)
			})
			
		$scope.submit = ()=>{
			$http.post('/api/auth/trakt', {pin:$scope.trakt.pin})
				.then(response=>{
					$log.info(response)
					$scope.trakt.connected = true
				})
				.catch(error=>{
					$log.error(error)
				})
		}
	}])