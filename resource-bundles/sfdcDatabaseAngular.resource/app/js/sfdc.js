'use strict';

angular.module('sfdcDatabase', [])
	.provider('sfdc', function() {

		var $http,
			$log,
			state,
			config;

		function checkSobjectRestResource() {
			// Ping the SObject endpoint to know if it exists.
			return $http({
				url: config.restSobjectResourceUrl,
				method: 'GET'
			}).then(function(res) {
				$log.debug('Sobject REST Resource verified.');
				state.hasSobjectRestResource = true;
			}, function(err) {
				$log.debug('No Sobject REST Resource.');
				state.hasSobjectRestResource = false;
			});
		}

		return {
			$get: ['$http', '$log', 'sfdcDatabaseState', 'sfdcDatabaseConfig', 'sfdcQuery', 'sfdcInsert', 'sfdcUpdate',
				function(_$http_, _$log_, sfdcDatabaseState, sfdcDatabaseConfig, sfdcQuery, sfdcInsert, sfdcUpdate) {

					$http = _$http_;
					$log = _$log_;
					state = sfdcDatabaseState;
					config = sfdcDatabaseConfig;

					// ??? Can we move this to a place which calls it sooner?
					if (state.hasSobjectRestResource === undefined) {
						checkSobjectRestResource();
					}
					
					return {
						query: sfdcQuery,
						insert: sfdcInsert,
						update: sfdcUpdate
					};
				}
			]
		};

	});
