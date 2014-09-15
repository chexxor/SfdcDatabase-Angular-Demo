'use strict';

angular.module('sfdcDatabase')
	.provider('jsrInvokeCustom', function() {
		
		var $q,
			$http,
			jsrConfig,
			state;

		function jsrCustomErrors(jsrResponse) {
			return jsrResponse.data.filter(function(r) {
				var hasError = false;
				if (r.statusCode >= 200 && r.statusCode < 300) {
				} else if (r.statusCode >= 400 && r.statusCode < 500) {
					hasError = true;
				}
				return hasError;
			});
		}
		
		function normalizeJsrResponse(result) {
			var normalizedResult = result.data && result.data[0] && result.data[0].result;
			return normalizedResult;
		}

		function normalizeJsrError(errorResponse) {
			return errorResponse.map(function(r) {
				return {
					error: r.type + ': ' + r.message,
					statusCode: r.statusCode
				};
			});
		}

		// function jsrInvokeCustom(targetClass, targetMethod, methodData) {
		function jsrInvokeCustom(remoteAction, methodData) {
			var targetClass = remoteAction.split('.')[0],
				targetMethod = remoteAction.split('.')[1];
			var targetMethodConfig = jsrConfig.actions[targetClass].ms.filter(function(m) {
				return m.name == targetMethod;
			})[0];
			if (!targetMethodConfig) {
				return $q.when({
					error: 'Invalid Remote Class or Method: ' + targetClass + '.' + targetMethod
				});
			}
			return $http({
				url: '/apexremote',
				method: 'POST',
				headers: {
					"X-User-Agent": 'Visualforce-Remoting',
					"X-Requested-With": 'XMLHttpRequest'
				},
				data: {
					action: targetClass,
					ctx: {
						csrf: targetMethodConfig.csrf,
						ns: '',
						ver: targetMethodConfig.ver,
						vid: jsrConfig.vf.vid
					},
					data: [methodData],
					method: targetMethod,
					tid: ++state.jsrTransactionCounter,
					type: 'rpc'
				},
			}).then(function(response) {
				var errorItems = jsrCustomErrors(response);
				if (errorItems.length > 0) {
					return $q.reject(normalizeJsrError(errorItems));
				}
				return normalizeJsrResponse(response);
			});
		}

		return {
			$get: ['$log', '$http', '$q', 'jsrConfig', 'sfdcDatabaseState',
				function($log, _$http_, _$q_, _jsrConfig_, sfdcDatabaseState) {

				$http = _$http_;
				$q = _$q_;
				jsrConfig = _jsrConfig_;
				state = sfdcDatabaseState;

				return jsrInvokeCustom;
			}]
		};
	});