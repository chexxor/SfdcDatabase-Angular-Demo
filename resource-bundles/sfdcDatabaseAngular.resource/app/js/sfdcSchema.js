'use strict';

var Visualforce = Visualforce;

angular.module('sfdcDatabase')
	.provider('sfdcSchema', function() {

		var $http,
			$log,
			state,
			appConfig;

		function sObjectNameFromId(id) {
			var describe = sObjectDescribeFromId(id);
			return (describe && describe.name) || null;
		}

		function sObjectDescribeFromId(id) {
			var idPrefix = id.slice(0, 3),
				sfdcSchema = state.sfdcSchema;
			if (!sfdcSchema || !sfdcSchema.sobjects) {
				// ??? Can we do something better if we don't have a schema?
				return {
					error: 'No or invalid schema. Was the response not sent or did it not return?'
				};
			}
			var matches = sfdcSchema.sobjects.filter(function(s) {
				return s.keyPrefix === idPrefix;
			});
			return (matches && matches.length > 0 && matches[0]) || null;
		}

		return {
			$get: ['$http', '$log', 'sfdcDatabaseState', 'sfdcDatabaseConfig',
				function(_$http_, _$log_, sfdcDatabaseState, sfdcDatabaseConfig) {
					$http = _$http_;
					$log = _$log_;
					state = sfdcDatabaseState;
					appConfig = sfdcDatabaseConfig;

					// Initialize.
					// Get schema.
					var schemaEndpoint = '/services/data/' + appConfig.apiVersion + '/sobjects';
					$http({
						url: schemaEndpoint,
						method: 'GET'
					}).then(function(response) {
						$log.debug('sObject schema for org: ', response);
						state.sfdcSchema = response.data;
					});

					return {
						sObjectDescribeFromId: sObjectDescribeFromId,
						sObjectNameFromId: sObjectNameFromId
					};
				}
			]
		};

	});
