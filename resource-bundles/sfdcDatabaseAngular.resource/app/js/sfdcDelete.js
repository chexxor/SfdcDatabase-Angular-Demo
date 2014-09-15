'use strict';

var Visualforce = Visualforce;

angular.module('sfdcDatabase')
	.provider('sfdcDelete', function() {

		var $http,
			$q,
			$rootScope,
			$log,
			state,
			appConfig,
			sfdcSchema,
			jsrConfig,
			utils,
			config,
			jsrInvoke,
			jsrInvokeCustom;

		function recordsFromCrudResponse(response) {
			if (response instanceof Array) {
				return response;
			}
			return response.data && response.data.records;
		}

		function checkSobjectRestResource() {
			// Ping the SObject endpoint to know if it exists.
			return $http({
				url: appConfig.restSobjectResourceUrl,
				method: 'GET'
			}).then(function(res) {
				$log.log('Sobject REST Resource verified.');
				appConfig.hasSobjectRestResource = true;
			}, function(err) {
				$log.log('No Sobject REST Resource.');
				appConfig.hasSobjectRestResource = false;
			});
		}

		function doesJsrExist() {
			$log.log('Visualforce?', Visualforce);
			if (!(Visualforce && Visualforce.remoting && Visualforce.remoting.Manager)) {
				return false;
			}
			return true;
		}

		function hasSobjectRest() {
			return appConfig.hasSobjectRestResource;
		}

		function readonlyFields(table) {
			// !!! Find good way to find a table's undeleteable fields.
			return [
				// 'Id'
			];
		}

		// Function implementations.

		function jsrDelete(records, configUser) {
			var jsrConfig = utils.extend(utils.extend(appConfig.jsrConfigDefault, configUser), {
				params: {
					records: records
				}
			});

			records.forEach(function(r) {
				// JS Remoting uses the `Id` and `sObjectType` properties
				//   to determine the sObject's type.
				var sObjectType = sfdcSchema.sObjectNameFromId(r.Id);
				if (sObjectType) {
					r.sObjectType = sObjectType;
				}
				// Remove fields which can't be deleted.
				utils.omit(r, readonlyFields(r.sObjectType).concat(['attributes']));
			});

			return jsrInvoke(appConfig.sfdcEndpoints.REMOTE_ACTION_DELETE,
				records,
				jsrConfig).then(recordsFromCrudResponse);
		}

		function jsrDeleteCustom(records, configUser) {
			var jsrConfig = utils.extend(utils.extend(appConfig.jsrConfigDefault, configUser), {
				params: {
					records: records
				}
			});

			records.forEach(function(r) {
				// JS Remoting uses the `Id` and `sObjectType` properties
				//   to determine the sObject's type.
				var sObjectType = sfdcSchema.sObjectNameFromId(r.Id);
				if (sObjectType) {
					r.sObjectType = sObjectType;
				}
				// Remove fields which can't be deleted.
				utils.omit(r, readonlyFields(r.sObjectType).concat(['attributes']));
			});

			// return jsrInvokeCustom('sfdcDatabaseCtlr', 'delet', records);
			return jsrInvokeCustom(appConfig.sfdcEndpoints.REMOTE_ACTION_DELETE,
				records,
				jsrConfig).then(recordsFromCrudResponse);
		}

		function restDeleteCustom(records, configUser) {
			// var records_ = removeReadonlyFields(records);
			records.forEach(function(r) {
				// Remove fields which can't be deleted.
				// utils.omit(r, readonlyFields(table).concat(['attributes']));
				utils.omit(r, [].concat(['attributes']));
			});
			var config = utils.extend(utils.extend({
				url: appConfig.restSobjectResourceUrl,
				method: 'DELETE'
			}, configUser), {
				// data: {
				//	records: records
				// }
				data: records
			});
			return $http(config).then(recordsFromCrudResponse);
		}

		function restDeleteVanilla(records, configUser) {
			// var config = utils.extend(utils.extend(restConfigDeleteDefault, configUser), {
			//	params: {
			//		records: records
			//	}
			// });
			// return $http(config, records).then(recordsFromCrudResponse);
			// Example: /services/data/v29.0/sobjects/Account/001C000000xQbd8IAC
			var pResponses = records.map(function(r) {
				var table = (r.attributes && r.attributes.type) || sfdcSchema.sObjectNameFromId(r.Id),
					url = (r.attributes && r.attributes.url) || '/services/data/' + appConfig.apiVersion + '/sobjects/' + table + '/' + r.Id;

				// Remove fields which can't be deleted.
				utils.omit(r, readonlyFields(table).concat(['attributes']));

				return $http({
					method: 'DELETE',
					url: url,
					data: r
				}).then(recordsFromCrudResponse);
			});
			return $q.all(pResponses).then(function(responses) {
				$log.log('Slow REST Responses', responses);
			});
		}

		function delet(records, restOrJsrConfig, transportFlagsUser) {

			// Guards
			if (!records) {
				return true;
			}
			if (records instanceof Array === false &&
				records instanceof Object === true) {
				records = [records];
			}
			if (records.length === 0) {
				return true;
			}

			// ??? Can we move this closer to where it's necessary?
			var records_ = angular.copy(records);

			var transportFlags = utils.extend(appConfig.transportFlagsDefault, transportFlagsUser);

			var pResult;
			if (doesJsrExist() && transportFlags.useJsr) {
				if (transportFlags.jsrVia$Http) {
					pResult = jsrDeleteCustom(records_, restOrJsrConfig);
				} else {
					pResult = jsrDelete(records_, restOrJsrConfig);
				}
			} else if (hasSobjectRest()) {
				pResult = restDeleteCustom(records_, restOrJsrConfig);
			} else {
				pResult = restDeleteVanilla(records_, restOrJsrConfig);
			}
			return pResult;
		}

		return {
			$get: ['$http', '$q', '$rootScope', '$log', 'sfdcDatabaseState', 'sfdcSchema', 'jsrConfig', 'sfdcDatabaseUtils', 'sfdcDatabaseConfig', 'jsrInvokeCustom', 'jsrInvoke',
				function(_$http_, _$q_, _$rootScope_, _$log_, sfdcDatabaseState, _sfdcSchema_, _jsrConfig_, sfdcDatabaseUtils, sfdcDatabaseConfig, _jsrInvokeCustom_, _jsrInvoke_) {
					$http = _$http_;
					$q = _$q_;
					$rootScope = _$rootScope_;
					$log = _$log_;
					state = sfdcDatabaseState;
					appConfig = sfdcDatabaseConfig;
					sfdcSchema = _sfdcSchema_;
					jsrConfig = _jsrConfig_;
					utils = sfdcDatabaseUtils;
					jsrInvoke = _jsrInvoke_;
					jsrInvokeCustom = _jsrInvokeCustom_;

					if (!hasSobjectRest()) {
						checkSobjectRestResource();
					}

					return delet;
				}
			]
		};

	});
