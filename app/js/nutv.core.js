/* global swal:false */
"use strict"

angular.module('nutv.core', ['ngAnimate','ngCookies','ngSanitize','ngStorage','ngTouch','btford.socket-io','ui.bootstrap','ui.router'])
		
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

	.factory('alertService', ['$log','$socket','$q',($log,$socket,$q)=>{
		const Alerts = function(){
			this.alerts = []
			$socket.on('alert', data=>{
				this.alert(data)
			})
			$socket.on('notify', data=>{
				this.notify(data)
			})
			return this
		}
		
		Alerts.prototype.close = function(idx){
			this.alerts.splice(idx, 1)
		}
		
		Alerts.prototype.alert = function(alert){
			const deferred = $q.defer()
			
			swal({
				title: alert.title,
				text: alert.text || undefined,
				type : alert.type || 'info',
				timer: alert.timer || 2000,
				toast: alert.toast || false,
				
				position: alert.toast ? 'top-end' : 'center',
				
				showCancelButton: false,
				showConfirmButton: false,
				
				onClose: ()=>{
					deferred.resolve()
				}
			})
			
			return deferred.promise
		}
		Alerts.prototype.confirm = function(alert){
			const deferred = $q.defer()
			swal({
				title: alert.title || 'Are you sure?',
				text: alert.text || undefined,
				type: alert.type || 'question',
				
				allowOutsideClick: false,
				showCancelButton: true,
				showConfirmButton: true,
				cancelButtonText: 'Nope',
				confirmButtonText: 'Yes, do it'
				
			}).then(result=>{
				if (result.value){
					this.alert({
						title: 'Done', type: 'success'
					})
					deferred.resolve(result)
				} else {
					deferred.reject(result)
				}
			})
			return deferred.promise
		}
		Alerts.prototype.notify = function(data){
			// Native browser alerts
			/*
			new Promise((resolve,reject)=>{
				if ('Notification' in window){
					$log.debug(Notification.permission)
					if (Notification.permission === 'granted') return resolve()
					
					Notification.requestPermission()
						.then(permission=>{
							if (permission === 'granted') return resolve()
							return reject()
						})
						.catch(()=>{
							return reject()
						})
				} else {
					return reject()
				}
			})
			.then(()=>{
				new Notification('NodeTV', {
					body: data.text || data.msg,
					badge:'/static/gfx/icons/icon-32.png',
					icon: data.icon || '/static/gfx/icons/icon-512.png'
				})
			})
			.catch(()=>{
				this.alerts.push({type:data.type,msg:data.msg})
			})
			*/
			this.alerts.push({
				type: data.type,
				title: data.title,
				text: data.text || data.msg
			})
		}
		
		return new Alerts()
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
				return item.title.replace(/^(The\s|A\s|\W)/i, '')
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
				$http.post(`/api/${this.type}s`, {slug:result.ids.slug,trakt:result.ids.trakt})
					.then(()=>{
						$state.go('^.detail', {slug:result.ids.slug})
						alertService.alert({type:'success',title:'Added',text:`'${result.title}' has been added to your library`})
					})
					.catch(()=>{
						alertService.notify({type:'danger',title:'Error',text:`An error occured while adding to your library`})
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
	