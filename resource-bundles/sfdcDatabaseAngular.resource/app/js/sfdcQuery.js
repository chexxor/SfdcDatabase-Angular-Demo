'use strict';

var Visualforce = Visualforce;

angular.module('sfdcDatabase')
	.provider('sfdcQuery', function() {

		var $http,
			$q,
			$rootScope,
			$log,
			state,
			utils,
			appConfig,
			jsrInvoke,
			jsrInvokeCustom;

		function recordsFromQueryResponse(response) {
			return response.data && response.data.records;
		}

		function doesJsrExist() {
			$log.debug('Visualforce?', Visualforce);
			if (!(Visualforce && Visualforce.remoting && Visualforce.remoting.Manager)) {
				return false;
			}
			return true;
		}

		function jsrQueryCustom(soql, configUser) {
			return jsrInvokeCustom('sfdcDatabaseCtlr', 'quer', soql);
		}

		// Function implementations.

		function jsrQuery(soql, jsrConfig) {
			return jsrInvoke(appConfig.sfdcEndpoints.REMOTE_ACTION_QUERY,
				soql,
				jsrConfig);
		}

		function restQuery(soql, configUser) {
			var httpConfig = utils.extend(utils.extend({
				method: 'GET',
				url: '/services/data/' + appConfig.apiVersion + '/query/'
			}, configUser), {
				params: {
					q: soql
				}
			});
			return $http(httpConfig).then(recordsFromQueryResponse);
		}

		function query(soql, restOrJsrConfig, transportFlagsUser) {
			var transportFlags = utils.extend(appConfig.transportFlagsDefault, transportFlagsUser);
			var pRecords;
			if (doesJsrExist() && transportFlags.useJsr) {
				if (transportFlags.jsrVia$Http) {
					pRecords = jsrQueryCustom(soql, restOrJsrConfig);
				} else {
					pRecords = jsrQuery(soql, restOrJsrConfig);
				}
			} else {
				pRecords = restQuery(soql, restOrJsrConfig);
			}
			return pRecords;
		}

		return {
			$get: ['$http', '$q', '$rootScope', '$log', 'sfdcDatabaseState', 'sfdcDatabaseUtils', 'sfdcDatabaseConfig', 'jsrInvokeCustom', 'jsrInvoke',
				function(_$http_, _$q_, _$rootScope_, _$log_, sfdcDatabaseState, sfdcDatabaseUtils, sfdcDatabaseConfig, _jsrInvokeCustom_, _jsrInvoke_) {
					$http = _$http_;
					$q = _$q_;
					$rootScope = _$rootScope_;
					$log = _$log_;
					state = sfdcDatabaseState;
					utils = sfdcDatabaseUtils;
					appConfig = sfdcDatabaseConfig;
					jsrInvoke = _jsrInvoke_;
					jsrInvokeCustom = _jsrInvokeCustom_;

					return query;
				}
			]
		};

	});
