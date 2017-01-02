"use strict";

angular.module('nutv.core', ['ngAnimate','ngMessages','ngStorage','ngTouch','btford.socket-io','ui.bootstrap'])
	
	.factory('$socket', function (socketFactory) {
		var socket = socketFactory();
		socket.forward('alert');
		return socket;
	})

	.run(['$http','$localStorage','$log',function($http,$localStorage,$log){
		if ($localStorage.token){
			$http.defaults.headers.common['x-username'] = $localStorage.token.username;
			$http.defaults.headers.common['x-token'] = $localStorage.token.token;
		} else {
			$http.get('/auth/token')
				.then(function(response){
					$localStorage.token = {};
					$http.defaults.headers.common['x-username'] = $localStorage.token.username = response.data.username;
					$http.defaults.headers.common['x-token'] = $localStorage.token.token = response.data.token;
				})
				.catch(function(error){
					$log.error(error);
				})
		}
	}])
