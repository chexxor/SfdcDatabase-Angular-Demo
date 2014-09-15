'use strict';

angular.module('sfdcDatabase')
	.provider('jsrInvoke', function() {

		var $log,
			$q,
			$rootScope,
			utils,
			state,
			appConfig;

		// Create a function which handles JSR responses. It resolves the specified
		//   deferred object and digests the effect on the specified score.
		function jsrDataHandlerFactory(dReturnVal, $rootScope) {
			return function jsrDataHandler(returnVal, jsrEvent) {
				if (jsrEvent.status) {
					dReturnVal.resolve(returnVal);
				} else if (jsrEvent.type === 'exception') {
					dReturnVal.reject('JS Remoting Exception:' + jsrEvent.message, returnVal);
				} else {
					dReturnVal.reject('JS Remoting Error:' + jsrEvent.message, returnVal);
				}
				if (!$rootScope.$$phase) $rootScope.$apply();
			};
		}
		
		function jsrInvoke(remoteAction, params, configUser) {
			var config = utils.extend(appConfig.jsrConfigDefault, configUser);
			var dReturnVal = $q.defer();
			var jsrDataHandler = jsrDataHandlerFactory(dReturnVal, $rootScope);
			state.jsrTransactionCounter++;
			Visualforce.remoting.Manager.invokeAction(
				remoteAction,
				params,
				jsrDataHandler,
				config
			);
			return dReturnVal.promise;
		}

		return {
			$get: ['$log', '$q', '$rootScope', 'sfdcDatabaseUtils', 'sfdcDatabaseState', 'sfdcDatabaseConfig',
				function(_$log_, _$q_, _$rootScope_, sfdcDatabaseUtils, sfdcDatabaseState, sfdcDatabaseConfig) {

				$log = _$log_;
				$q = _$q_;
				$rootScope = _$rootScope_;
				utils = sfdcDatabaseUtils;
				state = sfdcDatabaseState;
				appConfig = sfdcDatabaseConfig;

				return jsrInvoke;
			}]
		};
	});