'use strict';

angular.module('sfdcDatabase')
	.service('sfdcDatabaseState', ['$window',
		function($window) {
		// `undefined` value means not yet checked.
		this.hasSobjectRestResource;
		this.sfdcSchema;
		this.vfrTransactionCounter = 0;

		// this.sfdcEndpoints = {
		// 	REMOTE_ACTION_QUERY: $window.sfdcDatabaseConfig.REMOTE_ACTION_QUERY,
		// 	REMOTE_ACTION_INSERT: $window.sfdcDatabaseConfig.REMOTE_ACTION_INSERT,
		// 	REMOTE_ACTION_UPDATE: $window.sfdcDatabaseConfig.REMOTE_ACTION_UPDATE
		// }
	}]);