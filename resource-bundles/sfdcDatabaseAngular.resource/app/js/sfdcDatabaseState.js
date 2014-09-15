'use strict';

angular.module('sfdcDatabase')
	.service('sfdcDatabaseState', ['$window',
		function($window) {
		// `undefined` value means not yet checked.
		this.hasSobjectRestResource;
		this.sfdcSchema;
		this.jsrTransactionCounter = 0;
	}]);