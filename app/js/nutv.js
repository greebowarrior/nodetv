"use strict"

angular.module('nutv', ['nutv.core','nutv.shows'])
	
	.config(['$stateProvider','$urlRouterProvider',($stateProvider,$urlRouterProvider)=>{
		$urlRouterProvider.when('/', $state=>{
			$state.transitionTo('dashboard.home')
		}).otherwise('/')
		
		$stateProvider
			.state('login', {
				url: '/login',
				controller: 'LoginCtrl',
				templateUrl: 'views/auth/login.html',
				breadcrumb: {
					label: 'Login'
				}
			})
			.state('logout', {
				url: '/logout',
				controller: 'LogoutCtrl',
				templateUrl: 'views/auth/logout.html',
				breadcrumb: {
					label: 'Logout'
				}
			})
			.state('dashboard', {
				url: '/dashboard',
				abstract: true,
				template: '<ui-view/>'
			})
			.state('dashboard.home', {
				url: '/',
				controller: 'DashboardCtrl',
				templateUrl: 'views/dashboard/index.html',
				breadcrumb: {
					label: 'Dashboard'
				}
			})
	}])
	
	.controller('NavigationCtrl', ['$localStorage','$scope',($localStorage,$scope)=>{
		$scope.collapsed = true
		$scope.authenticated = false
		
		$scope.$watch(()=>$localStorage.token, (current)=>{
			$scope.authenticated = current && current.token ? true : false
		},true)
	}])
	
	
	.controller('BodyCtrl', ['$scope', $scope=>{
		$scope.alerts = []
		
		$scope.alertClose = index=>{
			$scope.alerts.splice(index, 1)
		}
		
		$scope.$on('alert', (e,data)=>{
			$scope.alerts.push({type:data.type,msg:data.msg})
		})
	}])
	
	
	.controller('LoginCtrl', ['$http','$localStorage','$log','$scope','$state',function($http,$localStorage,$log,$scope,$state){
		$scope.auth = {}
		
		$scope.login = ()=>{
			$log.debug('Authenticating...')
			$http.post('/auth/login', $scope.auth)
				.then(response=>{
					$localStorage.token = response.data
					$state.go('dashboard.home')
				})
				.catch(()=>{
					$scope.$emit('alert',{type:'danger',msg:'Incorrect username/password'})
					$log.warn('Authentication error')
				})
		}
	}])

	.controller('LogoutCtrl', ['$http','$localStorage','$log','$scope','$state',function($http,$localStorage,$log,$scope,$state){
		$http.get('/auth/logout')
			.then(()=>{
				$log.debug('Logging out')
				delete $localStorage.token
				$state.go('dashboard.home')
			})
			.catch(()=>{
				$log.debug('fuck')
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