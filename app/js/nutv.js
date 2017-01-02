"use strict";

angular.module('nutv', ['nutv.core'])
	
	
	.controller('NavigationController', ['$http','$log',function($http,$log){
	//	$log.debug('')
	}])
	
	.controller('TestController', ['$http','$log','$scope',function($http,$log,$scope){
		$scope.show = {slug: null};
		$scope.movie = {slug: null};
		
		
		$scope.addMovie = function(){
			if (!$scope.movie.slug) return;
			$http.post('/api/movies',{slug:$scope.movie.slug})
				.then(function(response){
					$log.debug(response.data);
				})
				.catch(function(error){
					$log.error(error);
				})
		};
		$scope.addShow = function(){
			if (!$scope.show.slug) return;
			$http.post('/api/shows',{slug:$scope.show.slug})
				.then(function(response){
					$log.debug(response.data);
				})
				.catch(function(error){
					$log.error(error);
				})
		};
	}])
	
	.controller('TraktConnectController', ['$http','$log','$scope',function($http,$log,$scope){
		$scope.trakt = {
			connected: false,
			url: null,
			pin: null
		};
		
		$http.get('/api/auth/trakt')
			.then(function(response){
				$scope.trakt.url = response.data.url;
			})
			.catch(function(error){
				$log.error(error);
			});
			
		$scope.submit = function(){
			$http.post('/api/auth/trakt', {pin:$scope.trakt.pin})
				.then(function(response){
					$log.info(response);
					$scope.trakt.connected = true;
				})
				.catch(function(error){
					$log.error(error);
				})
		};
	}])