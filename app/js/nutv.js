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
			
			.state('install', {
				url: '/install',
				component: 'nutvInstall',
				breadcrumb: {
					title: 'Install'
				},
				resolve: {
					installed: ['$http','$state',($http,$state)=>{
						return $http.get('/auth/install')
							.then(res=>{
								if (res.data.installed) throw new Error('Installation already completed')
								return false
							})
							.catch(()=>{
								$state.go('login')
							})
					}]
				}
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
		controller: ['$cookies','$http','$log','$socket','$state','alertService',function($cookies,$http,$log,$socket,$state,alertService){
			this.auth = {}
			
			this.login = ()=>{
				$http.post('/auth/login', this.auth)
					.then(()=>{
						$socket.emit('authenticate', $cookies.get('jwt'))
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
		controller: ['$http','$log','$socket','$state',function($http,$log,$socket,$state){
			$http.get('/auth/logout')
				.then(()=>{
					$socket.emit('auth.logout')
					$state.go('dashboard.home')
				})
				.catch(()=>{
					$log.debug('An error occured while logging out')
				})
		}]
	})
	
	.component('nutvInstall', {
		templateUrl: 'views/dashboard/install.html',
		controller: ['$http','$log','$state','alertService',function($http,$log,$state,alertService){
			
			this.submit = ()=>{
				$http.post('/auth/install', this.user)
					.then(res=>{
						if (res.data.installed){
							alertService.notify({type:'success',msg:'Installation complete. Please log in.'})
							$state.go('login')
						}
					})
					.catch(()=>{
						alertService.notify({type:'danger',msg:'An error occured. Please try again'})
					})
			}
		}]
	})
	
	.component('nutvNavigation', {
		templateUrl: '/views/components/navigation.html',
		controller: ['$cookies','$log','$socket','$transitions',function($cookies,$log,$socket,$transitions){
			this.collapsed = true
			this.enabled = false
			
			this.$onInit = ()=>{
				if ($cookies.get('jwt')) this.enabled = true
			}
			
			$transitions.onStart({}, ()=>{
				this.collapsed = true
			})
			
			$socket.on('error',error=>{
				$log.error(error)
			})
			
			$socket.on('authenticated', (data)=>{
				this.enabled = data.status
			})
		}]
	})
	.component('nutvDashboard', {
		templateUrl: '/views/dashboard/index.html',
		controller: ['$http',function($http){
			
			// Generate a calendar
			this.$onInit = ()=>{
				/*
				let i = -7
				
				let now = new Date()
				this.dates = []
				this.test = []
				
				do {
					let day = new Date()
					day.setDate(now.getDate()+i)
					this.test[day.getDay()] = {episodes:[]}
					
					this.dates.push({date:day,num:day.getDay()})
					i++
				} while (i<=0)
				*/
			
				this.episodes = {
					recent: [], upcoming: []
				}
				this.count = {
					recent: null, upcoming: null
				}
				
				$http.get('/api/shows/latest')
					.then(response=>{
						
						/*
						response.data.forEach(show=>{
							show.episodes.forEach(episode=>{
								let dow = (new Date(episode.first_aired)).getDay()
								
								this.test[dow].episodes.push({
									title: show.title,
									images: show.images,
									episode: episode
								})
							})
						})
						*/
						
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
			}
		}]
	})
	
	.component('nutvUpnpDevice', {
		bindings: {close:'&',dismiss:'&'},
		templateUrl: '/views/components/upnp-device.html',
		controller: ['$http',function($http){
			this.$onInit = ()=>{
				this.devices = []
				
				$http.get('/api/upnp/devices').then(res=>{
					this.devices = res.data
				})
				this.play = (device)=>{
					this.close({$value:device})
				}
			}
		}]
	})
	
	.run(['$cookies','$socket','$log',($cookies,$socket,$log)=>{
	//	$transitions.onError({}, ()=>{
	//		alertService.notify({type:'danger',msg:'Unable to load this content. Sorry'})
	//	})
		
		if ('serviceWorker' in navigator){
			if (!navigator.serviceWorker.controller){
				navigator.serviceWorker.register('/static/js/nutv.service-worker.js', {scope:'/'})
					.then(()=>{
						$log.debug('[NuTV] Service Worker registered')
					})
					.catch((error)=>{
						$log.warn('[NuTV] Service Worker registration failed: ', error.message)
					})
			}
		}
		
		$socket.on('connect', ()=>{
			if ($cookies.get('jwt')) $socket.emit('authenticate', $cookies.get('jwt'))
		})
	}])