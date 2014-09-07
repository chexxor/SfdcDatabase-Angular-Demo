'use strict';

/* Controllers */

var console = console;

angular.module('myApp.controllers', [])
	.controller('BodyCtrl', ['$scope', '$location', '$route', 'AppErrors',
		function($scope, $location, $route, AppErrors) {
		// $scope.errors = AppErrors.errors;
		$scope.AppErrors = AppErrors;
		$scope.$location = $location;
		$scope.$route = $route;
	}])
	.controller('AboutCtrl', ['$scope', function($scope) {
	}])
	.controller('ApiCtrl', ['$scope', function($scope) {
	}])
	.controller('ComparisonCtrl', ['$scope', function($scope) {
	}])
	.controller('StatusCtrl', ['$scope', function($scope) {
	}])
	.controller('HomeCtrl', ['$scope', 'AccountState', 'sfdc', 'AppErrors', '$rootScope',
		function($scope, AccountState, sfdc, AppErrors, $rootScope) {
			$scope.gridOptions = AccountState.gridOptions;
			$scope.AccountState = AccountState;

			$scope.onAfterSaveItem = function(record, newFieldValue, transportFlags) {
				console.log('Edited record:', record);
				sfdc.update(record, undefined, transportFlags).then(function(record) {
				// sfdc.update(record, undefined, {
				// 	useJsr: false
				// 	// useJsr: true
				// 	// vfrVia$Http: true
				// }).then(function(record) {
					console.log('Update success!', record);
				}).catch(function(err) {
					console.log('Update error!', err);
					if (typeof err == 'string') {
						AppErrors.errors.push(err);
					} else if (typeof err == 'object') {
						if (err instanceof Array) {
							err.forEach(function(err) {
								// AppErrors.errors.push(err);
								AppErrors.errors.push(JSON.stringify(err, undefined, 4));
							});
						} else {
							// AppErrors.errors.push(JSON.stringify(err));
							AppErrors.errors.push(JSON.stringify(err, undefined, 4));
						}
					}
				});
			};

			// $scope.$on('ngGridEventEndCellEdit', function(event) {
			//	var record = event.targetScope.row.entity;
			//	console.log('Edited record:', record);
			//	// forceClient.update(record, undefined, {
			//	sfdc.update(record, undefined, {
			//		useJsr: false
			//	});
			// });
		}
	])
	.controller('MyCtrl2', ['$scope',
		function($scope) {

		}
	]);
