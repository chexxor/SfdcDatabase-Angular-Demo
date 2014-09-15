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
	.controller('HomeCtrl', ['$scope', 'AccountState', 'sfdc', 'AppErrors', '$rootScope', 'TransportFlags', 'httpLog',
		function($scope, AccountState, sfdc, AppErrors, $rootScope, TransportFlags, httpLog) {
			$scope.gridOptions = AccountState.gridOptions;
			$scope.AccountState = AccountState;
			$scope.TransportFlags = TransportFlags;
			$scope.httpLog = httpLog;

			$scope.onAfterSaveItem = function(record, newFieldValue, transportFlags) {
				console.log('Edited record:', record);
				return sfdc.update(record, undefined, transportFlags).then(function(records) {
					console.log('Update success!', records);
				}).catch(function(err) {
					console.log('Update error!', err);
					if (typeof err == 'string') {
						AppErrors.errors.push(err);
					} else if (typeof err == 'object') {
						if (err instanceof Array) {
							err.forEach(function(err) {
								AppErrors.errors.push(JSON.stringify(err, undefined, 4));
							});
						} else {
							AppErrors.errors.push(JSON.stringify(err, undefined, 4));
						}
					}
				});
			};
		}
	]);
