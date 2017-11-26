"use strict"

angular.module('nutv.core', ['ngAnimate','ngCookies','ngSanitize','ngStorage','ngSweetAlert','ngTouch','btford.socket-io','ui.bootstrap','ui.router'])
		
	.factory('httpIntercept', ['$cookies','$location','$q',($cookies,$location,$q)=>{
		return {
			request: config=>{
				if ($cookies.get('jwt')) config.headers['Authorization'] = 'Bearer '+$cookies.get('jwt')
				return config
			},
			response: response=>{
				return response
			},
			responseError: rejection=>{
				if (rejection.status === 401) $location.url('/login')
				return $q.reject(rejection)
			}
		}
	}])
	
	.factory('$socket', ['socketFactory',socketFactory=>{
		let socket = socketFactory({prefix:''})
		socket.forward('alert')
		return socket
	}])
	.factory('alertService', ['$rootScope','$socket','SweetAlert',($rootScope,$socket,SweetAlert)=>{
		let Alert = function(){
			this.alerts = []
			
			$rootScope.$on('alert', (event,alert)=>{
				this.add(alert)
			})
			$socket.on('alert', data=>{
				this.alert(data)
			})
			$socket.on('notify', data=>{
				this.notify(data)
			})
			
			return this
		}
		
		// Notifications
		Alert.prototype.add = function(data){
			return this.notify(data)
		}
		Alert.prototype.close = function(index){
			this.alerts.splice(index, 1)
		}
		Alert.prototype.notify = function(data){
			/*
			if ('Notification' in $window){
				if (Notification.permission === 'granted'){
					new Notification('NodeTV',{
						body: data.msg,
						badge:'/static/gfx/icons/touch-icon.png',
						icon:'/static/gfx/icons/touch-icon.png',
						image:'/static/gfx/icons/touch-icon.png'
					})
				} else if (Notification.permission !== 'denied'){
					Notification.requestPermission()
						.then(permission=>{
							if (!('permission' in Notification)){
								Notification.permission = permission
							}
							if (permission === 'granted'){
								new Notification('NodeTV',{
									body: data.msg,
									badge:'/static/gfx/icons/touch-icon.png',
									icon:'/static/gfx/icons/touch-icon.png'
								})
							}
						})
				}
			} else {
				this.alerts.push({type:data.type,msg:data.msg})
			}
			*/
			this.alerts.push({type:data.type,msg:data.msg})
		}
		
		// Alerts & Dialogs
		Alert.prototype.alert = function(data){
			return SweetAlert.swal({
				message: data.msg || undefined,
				timer: data.timer || 2000,
				title: data.title || undefined,
				type: data.type
			})
		}
		Alert.prototype.confirm = function(data){
			return new Promise(resolve=>{
				SweetAlert.swal({
					title: data.title,
					text: data.msg,
					type: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#DD6B55',
					confirmButtonText: 'Yes, do it',
					closeOnConfirm: false
				}, confirmed=>{
					if (confirmed){
						SweetAlert.swal({
							title: 'Done!',
							timer: 2000,
							type: 'success'
						})
						resolve(confirmed)
					}
				})
			})
		}
		
		Alert.prototype.swal = SweetAlert.swal
		
		return new Alert()
	}])
	.factory('crumbService', ['$interpolate','$log','$state','$transitions',($interpolate,$log,$state,$transitions)=>{
		const Crumbs = function(){
			this.crumbs = []
			this.resolved = {}
			
			$transitions.onSuccess({}, transition=>{
				if (!transition.dynamic()){
					this.crumbs = []
					let promises = transition.getResolveTokens().map(token=>{
						this.resolved[token] = transition.injector().get(token)
						return this.resolved[token]
					})
					Promise.all(promises).then(()=>{
						this.generate($state.$current)
					})
				}
			})
			return this
		}
		Crumbs.prototype.add = function(title,state,params){
			this.crumbs.push({
				title: title,
				state: state,
				params: params
			})
		}
		Crumbs.prototype.current = function(data){
			Object.assign(this.crumbs[this.crumbs.length-1], data)
		}
		Crumbs.prototype.list = function(){
			return this.crumbs
		}
		Crumbs.prototype.generate = function(state){
			if (state.parent) this.generate(state.parent)
			if (state.breadcrumb && state.breadcrumb.title){
				let target = state.name
				let title = $interpolate(state.breadcrumb.title)(this.resolved)
				if (state.self.abstract && (state.self.redirectTo || state.breadcrumb.state)) target = state.self.redirectTo || state.breadcrumb.state
				this.add(title, target, state.params)
			}
		}
		return new Crumbs()
	}])
	
	.filter('zeroFill', ()=>(a,b)=>(1e4+""+a).slice(-b))
	.filter('definiteArticle', ()=>(item)=>item.title.replace(/^The\s/i, ''))
	
	.directive('title', ['$timeout','$transitions','crumbService',($timeout,$transitions,crumbService)=>{
		// Dynamically update the title to match the breadcrumbs
		return {
			restrict: 'E',
			link: function (scope,element){
				let title = element.html()
				
				$transitions.onSuccess({}, ()=>{
					$timeout(()=>{
						let crumbs = [title]
						crumbService.list().forEach(crumb=>{
							if (crumb.title) crumbs.push(crumb.title)
						})
						element.html(crumbs.join(` &raquo; `))
					},0)
				})
			}
		}
	}])
	
	.directive('compareTo', ()=>{
		return {
			require: 'ngModel',
			scope: {
				compare: '=compareTo'
			},
			link: function(scope,element,attr,ngModel){
				ngModel.$validators.compareTo = (value)=>{
	                return value === scope.compare
	            }
	            scope.$watch('compare', ()=>{
	                ngModel.$validate()
	            })
			}
		}
	})
	
	.component('nutvBreadcrumbs', {
		// Automatically generate breadcrumbs from the router
		templateUrl: 'views/components/breadcrumbs.html',
		controller: ['$transitions','crumbService', function($transitions,crumbService){
			$transitions.onSuccess({}, (transition)=>{
				if (!transition.dynamic()){
					this.crumbs = crumbService.list()
				}
			})
		}]
	})
	.component('nutvGrid', {
		bindings: {list:'<',type:'<',page:'<'},
		templateUrl: 'views/components/grid.html',
		controller: ['$http','$log','$sessionStorage','$state',function($http,$log,$sessionStorage,$state){
			if (!$sessionStorage.filter) $sessionStorage.filter = {title: ''}
			
			this.$onInit = ()=>{
				this.filter = $sessionStorage.filter
				this.pagination = {items:18, page:this.page}
			}
			this.uiOnParamsChanged = (params)=>{
				this.pagination.page = params.page
			}
			
			this.clearResults = ()=>{
				this.results = []
			}
			this.definiteArticle = (item)=>{
				return item.title.replace(/^The\s/i, '')
			}
			this.pageChange = ()=>{
				$state.go('.', {page:this.pagination.page})
			}
			this.search = ()=>{
				if (this.items.length > 1 || this.filter.title.length <= 1) return
				$http.post(`/api/trakt/search/${this.type}`,{q:this.filter.title})
					.then(res=>{
						this.results = res.data
					})
			}
		}]
	})
	.component('nutvSearch', {
		bindings: {type:'<',results:'='},
		templateUrl: '/views/components/search.html',
		controller: ['$http','$log','$state','alertService',function($http,$log,$state,alertService){
			
			this.add = (result)=>{
				$http.post(`/api/${this.type}s`, {slug:result.ids.slug})
					.then(()=>{
						$state.go('^.detail', {slug:result.ids.slug})
						alertService.alert({type:'success',title:'Added',msg:`'${result.title}' has been added to your library`})
					})
					.catch(()=>{
						alertService.notify({type:'danger',msg:`An error occured while adding to your library`})
					})
			}
		}]
	})
	
	.config(['$httpProvider','$localStorageProvider','$locationProvider','$sessionStorageProvider',
			($httpProvider,$localStorageProvider,$locationProvider,$sessionStorageProvider)=>{
				$httpProvider.interceptors.push('httpIntercept')
				$locationProvider.html5Mode(true)
				
				$localStorageProvider.setKeyPrefix('NodeTV-')
				$sessionStorageProvider.setKeyPrefix('NodeTV-')
			}])
	