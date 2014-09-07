'use strict';

angular.module('sfdcDatabase')
	.provider('jsrInvokeCustom', function() {
		
		var $q,
			$http,
			vfrConfig,
			state;

		function vfrCustomErrors(vfrResponse) {
			return vfrResponse.data.filter(function(r) {
				var hasError = false;
				if (r.statusCode >= 200 && r.statusCode < 300) {
				} else if (r.statusCode >= 400 && r.statusCode < 500) {
					hasError = true;
				}
				return hasError;
			});
		}
		
		function normalizeVfrResponse(result) {
			var normalizedResult = result.data;
			return normalizedResult;
		}

		function normalizeVfrError(errorResponse) {
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
			var targetMethodConfig = vfrConfig.actions[targetClass].ms.filter(function(m) {
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
						vid: vfrConfig.vf.vid
					},
					data: [methodData],
					method: targetMethod,
					tid: ++state.vfrTransactionCounter,
					type: 'rpc'
				},
			}).then(function(response) {
				var errorItems = vfrCustomErrors(response);
				if (errorItems.length > 0) {
					return $q.reject(normalizeVfrError(errorItems));
				}
				return normalizeVfrResponse(response);
			});
		}

		return {
			$get: ['$log', '$http', '$q', 'vfrConfig', 'sfdcDatabaseState',
				function($log, _$http_, _$q_, _vfrConfig_, sfdcDatabaseState) {

				$http = _$http_;
				$q = _$q_;
				vfrConfig = _vfrConfig_;
				state = sfdcDatabaseState;

				return jsrInvokeCustom;
			}]
		};
	});