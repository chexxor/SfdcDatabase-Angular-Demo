'use strict';

var Visualforce = Visualforce;

angular.module('sfdcDatabase')
	.provider('sfdcInsert', function() {

		var $http,
			$q,
			$rootScope,
			$log,
			utils,
			state,
			appConfig,
			jsrInvoke,
			jsrInvokeCustom;

		function recordsFromQueryResponse(response) {
			return response.data && response.data.records;
		}

		function recordsFromCrudResponse(response) {
			return response.data && response.data.records;
		}

		function checkSobjectRestResource() {
			// Ping the SObject endpoint to know if it exists.
			return $http({
				url: appConfig.restSobjectResourceUrl,
				method: 'GET'
			}).then(function(res) {
				$log.log('Sobject REST Resource verified.');
				hasSobjectRestResource = true;
			}, function(err) {
				$log.log('No Sobject REST Resource.');
				hasSobjectRestResource = false;
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
			return hasSobjectRestResource;
		}

		function readonlyFields(table) {
			// !!! Find a good way to find a table's un-updateable fields.
			return [
				'Id'
			];
		}

		// Function implementations.

		function jsrInsert(records, configUser) {
			var jsrConfig = utils.extend(utils.extend(appConfig.jsrConfigDefault, configUser), {
				params: {
					records: records
				}
			});

			records.forEach(function(r) {
				// JS Remoting uses the `Id` and `sObjectType` properties
				//   to determine the sObject's type.
				var table = r.attributes.type;
				r.sObjectType = table;
				// Remove fields which can't be updated.
				utils.omit(r, readonlyFields(table).concat(['attributes']));
			});

			return jsrInvoke(appConfig.sfdcEndpoints.REMOTE_ACTION_INSERT,
				records,
				jsrConfig);
		}

		function jsrInsertCustom(records, configUser) {
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
				// Remove fields which can't be inserted.
				utils.omit(r, readonlyFields(r.sObjectType).concat(['attributes']));
			});

			// return jsrInvokeCustom('sfdcDatabaseCtlr', 'inser', records);
			return jsrInvoke(appConfig.sfdcEndpoints.REMOTE_ACTION_INSERT,
				records,
				jsrConfig);
		}

		function restInsertBulk(records, configUser) {
			// var records_ = removeReadonlyFields(records);
			records.forEach(function(r) {
				// Remove fields which can't be updated.
				var table = r.attributes.type;
				// r.sObjectType = table;
				// utils.omit(r, readonlyFields(table).concat(['attributes']));
				utils.omit(r, [].concat(['attributes']));
			});
			var config = utils.extend(utils.extend({
				url: appConfig.restSobjectResourceUrl,
				method: 'PATCH'
			}, configUser), {
				data: records
			});
			return $http(config).then(recordsFromCrudResponse);
		}

		function restInsertSingle(records, configUser) {
			// var config = utils.extend(utils.extend(restConfigInsertDefault, configUser), {
			//	params: {
			//		records: records
			//	}
			// });
			// return $http(config, records).then(recordsFromCrudResponse);
			// Example: /services/data/v29.0/sobjects/Account
			var pResponses = records.map(function(r) {
				var table = r.attributes.type,
 					url = '/services/data/' + appConfig.apiVersion + '/sobjects/' + table;

				// Remove fields which can't be updated.
				utils.omit(r, readonlyFields(table).concat(['attributes']));

				return $http({
					method: 'POST',
					url: url,
					data: r
				}).then(recordsFromCrudResponse);
			});
			return $q.all(pResponses).then(function(responses) {
				$log.log('Slow REST Responses', responses);
			});
		}

		function insert(records, restOrJsrConfig, transportFlagsUser) {

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

			var records_ = angular.copy(records);

			var transportFlags = utils.extend(transportFlagsDefault, transportFlagsUser);

			var pResult;
			if (doesJsrExist() && transportFlags.useJsr) {
				if (transportFlags.vfrVia$Http) {
					pResult = jsrInsertCustom(records_, restOrJsrConfig);
				} else {
					pResult = jsrInsert(records_, restOrJsrConfig);
				}
			} else if (hasSobjectRest()) {
				pResult = restInsertBulk(records_, restOrJsrConfig);
			} else {
				pResult = restInsertSingle(records_, restOrJsrConfig);
			}
			return pResult;
		}

		return {
			$get: ['$http', '$q', '$rootScope', '$log', 'sfdcDatabaseUtils', 'sfdcDatabaseState', 'sfdcDatabaseConfig', 'jsrInvokeCustom', 'jsrInvoke',
				function(_$http_, _$q_, _$rootScope_, _$log_, sfdcDatabaseUtils, sfdcDatabaseState, sfdcDatabaseConfig, _jsrInvokeCustom_, _jsrInvoke_) {
					$http = _$http_;
					$q = _$q_;
					$rootScope = _$rootScope_;
					$log = _$log_;
					utils = sfdcDatabaseUtils;
					state = sfdcDatabaseState;
					appConfig = sfdcDatabaseConfig;
					jsrInvoke = _jsrInvoke_;
					jsrInvokeCustom = _jsrInvokeCustom_;

					return insert;
				}
			]
		};

	});
