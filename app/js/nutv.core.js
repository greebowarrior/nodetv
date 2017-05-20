"use strict"

angular.module('nutv.core', ['ngAnimate','ngMessages','ngStorage','ngTouch','btford.socket-io','ui.bootstrap','ui.router'])
		
	.factory('$socket', (socketFactory)=>{
		let socket = socketFactory()
		socket.forward('alert')
		return socket
	})
	.factory('httpIntercept', ['$localStorage','$location','$q',($localStorage,$location,$q)=>{
		return {
			request: config=>{
				if ($localStorage.token){
					if ($localStorage.token.username) config.headers['X-Username'] = $localStorage.token.username
					if ($localStorage.token.username) config.headers['X-Token'] = $localStorage.token.token
				}
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
	.config(['$localStorageProvider','$locationProvider','$httpProvider',($localStorageProvider,$locationProvider,$httpProvider)=>{
		$locationProvider.html5Mode(true)
		$localStorageProvider.setKeyPrefix('NodeTV-')
		$httpProvider.interceptors.push('httpIntercept')
	}])
	
	.filter('zeroFill', ()=>(a,b)=>(1e4+""+a).slice(-b))
	
	.directive('dynamicTitle', ($log,$timeout)=>{
		return {
			restrict: 'A',
			link: (scope,element)=>{
				let breadcrumbs = [element.text()]
				
				// TODO: detect changes
				
				$timeout(()=>{
					element.text(breadcrumbs.join(' - '))
				})
			}
		}
	})
	