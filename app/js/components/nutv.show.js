"use strict"

angular.module('nutv.show', ['nutv.core'])

	.directive('searchResult', ()=>{
		return {
			restrict: 'EAC',
			scope: {
				show: '='
			},
			controller: ['$log','$scope',($log,$scope)=>{
				
				$log.debug('cunt', $scope.show)
				
			//	$scope.title = 'derp'
			}]
		}
	})