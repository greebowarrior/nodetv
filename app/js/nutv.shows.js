"use strict"

angular.module('nutv.shows', ['nutv.core'])
	
	.config(['$stateProvider',($stateProvider)=>{
		$stateProvider
			.state('shows', {
				abstract: true,
				url: '/shows',
				template: '<ui-view />',
				data: {
					breadcrumb: 'Shows'
				}				
			})
			.state('shows.add', {
				url: '/add',
				controller: 'ShowsCtrl',
				templateUrl: 'views/show/add.html'
			})
			.state('shows.list', {
				url: '/',
				controller: 'ShowsCtrl',
				templateUrl: 'views/show/list.html'
			})
			.state('shows.show', {
				url: '/:slug',
				controller: 'ShowCtrl',
				templateUrl: 'views/show/index.html',
				data: {
					breadcrumb: 'Show name here'
				}
			})
			.state('shows.show.season', {
				url: '/seasons/:season',
				controller: 'SeasonCtrl',
				templateUrl: 'views/show/season.html',
				data: {
					breadcrumb: 'Season #'
				}
			})
	}])
	
	.controller('ShowsCtrl', ['$http','$log','$scope',function($http,$log,$scope){
		$scope.items = []
		$scope.results = []
		
		$http.get('/api/shows')
			.then(response=>{
				$scope.items = response.data
			})
			.catch(()=>{
			//	if (error) $log.error(error.statusText)
			})
		
		$scope.search = ()=>{
			$http.post('/api/trakt/search/show',{q:$scope.query})
				.then(response=>{
					$scope.results = response.data
				})
				.catch(error=>{
					$log.error(error)
				})
		}
	}])
	.controller('ShowCtrl', ['$http','$log','$scope','$stateParams',function($http,$log,$scope,$stateParams){
		$scope.show = {}
		$scope.images = []
		
		$scope.save = ()=>{
			$http.patch(`/api/shows/${$scope.show.ids.slug}`, {config:$scope.show.config})
				.then(response=>{
					// success, post a notification
					$scope.$emit('alert', {type:'success',msg:`${$scope.show.title} updated`})
					$log.debug(response)
				})
				.catch(error=>{
					$scope.$emit('alert', {type:'danger',msg:`${$scope.show.title} was not updated`})
					$log.error(error)
				})
		}
		
		$scope.getArtwork = ()=>{
			$http.get(`/api/shows/${$stateParams.slug}/artwork`)
				.then(response=>{
					$scope.images = response.data
				})
				.catch(error=>{
					if (error) $log.error(error)
				})
		}
		
		if ($stateParams.slug){
			$http.get(`/api/shows/${$stateParams.slug}`)
				.then(response=>{
					$scope.show = response.data
					if (!$scope.show.config.feed.length) $scope.show.config.feed.push({url:''})
				})
				.catch(error=>{
					if (error) $log.error(error.message)
				})
		}
	}])
	.controller('SeasonCtrl', ['$http','$log','$scope','$stateParams',function($http,$log,$scope,$stateParams){
		$scope.season = {}
		
		$http.get(`/api/shows/${$stateParams.slug}/seasons/${$stateParams.season}`)
			.then(season=>{
				$scope.season = season.data
				return $http.get(`/api/shows/${$stateParams.slug}/seasons/${$stateParams.season}/episodes`)
			})
			.then(episodes=>{
				$scope.episodes = episodes.data
			})
			.catch(error=>{
				if (error) $log.error(error)
			})
			.finally(()=>{
				$log.debug('finally')
			})
	}])
	.controller('EpisodeCtrl', function(){
		
	})
	.controller('ResultCtrl', ['$http','$log','$scope','$state',function($http,$log,$scope,$state){
		$scope.add = ()=>{
			$http.post('/api/shows', {slug: $scope.result.show.ids.slug})
				.then(response=>{
					$scope.$emit('alert',{type:'success',msg:`Added: ${response.data.title}`})
					$state.go('shows.show', {slug:response.data.ids.slug})
				})
				.catch(()=>{
					$scope.$emit('alert',{type:'danger',msg:`Error while adding show`})
				})
		}
	}])
	