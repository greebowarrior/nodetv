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
			.state('dashboard.tools', {
				url: '/tools',
				component: 'nutvDashboardTools',
				breadcrumb: {
					title: 'Tools'
				}
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
						alertService.notify({type:'danger',title:'Error',text:'Incorrect username/password'})
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
							alertService.notify({type:'success',title:'Installation complete',text:'Please log in.'})
							$state.go('login')
						}
					})
					.catch(()=>{
						alertService.notify({type:'danger',text:'An error occured. Please try again'})
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
		controller: ['$http','$state','alertService',function($http,$state,alertService){
			
			// Generate a calendar
			this.$onInit = ()=>{
				this.movies = []
				
				this.episodes = {
					recent: [], upcoming: []
				}
				this.count = {
					recent: null, upcoming: null
				}
				
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
					
				$http.get(`/api/movies/available`)
					.then(res=>{
						this.movies = res.data
					})
					.catch(()=>{
					//	$log.error(error.message)
					})
			}
			
			this.addMovie = (movie)=>{
				alertService.confirm({
					title: `Add Movie`,
					text: `Do you want to add "${movie.title}" to your video library?`,
					type: 'question'
				}).then(()=>{
					$http.post(`/api/movies`, {slug:movie.ids.slug}).then(res=>{
						$state.go('movies.detail', {slug:res.data.ids.slug})
					})
				})
			}
		}]
	})
	
	.component('nutvDashboardTools', {
		templateUrl: '/views/dashboard/tools.html',
		controller: ['$http','$log','alertService',function($http,$log,alertService){
			this.$onInit = ()=>{
				this.confirmed = false
			}
			
			this.movieScan = ()=>{
				alertService.confirm({
					type: 'warning',
					title: 'Upgrade Movies',
					text: 'This will perform a full rescan of your movie library, and may take some time. Are you sure you want to proceed?'
				}).then(()=>{
					return $http.post('/api/movies/scan',{})
				}).then(res=>{
					alertService.alert({type:'info',title:'Rescan in progress',text:'This may take a while to complete'})
					$log.debug(res.data)
				})
			}
			this.movieSync = ()=>{
				alertService.confirm({
					type: 'warning',
					title: 'Rebuild Movie Library?',
					text: 'This will re-sync your entire movie library from Trakt.tv'
				}).then(()=>{
					return $http.post('/api/movies/sync', {})
				}).then(res=>{
					alertService.alert({type:'info',title:'Resync in progress',text:'This may take a while to complete'})
					$log.debug(res.data)
				})
			}
			this.movieUpgrade = ()=>{
				alertService.confirm({
					type: 'warning',
					title: 'Upgrade Movie Library?',
					text: 'This will upgrade your movie library to the new structure, and may take some time. Are you sure you want to proceed?'
				}).then(()=>{
					return $http.post('/api/movies/upgrade',{})
				}).then(res=>{
					alertService.alert({type:'info',title:'Rescan in progress',text:'This may take a while to complete'})
					$log.debug(res.data)
				})
			}
		}]
	})
	
	.component('nutvUpnpDevice', {
		bindings: {close:'&',dismiss:'&'},
		templateUrl: '/views/components/upnp-device.html',
		controller: ['$http','$socket',function($http,$socket){
			this.devices = []
			this.$onInit = ()=>{
				$socket.on('upnp.device', (device)=>this.devices.push(device))
				$socket.emit('upnp.search')
			}
			this.play = (device)=>{
				this.close({$value:device})
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