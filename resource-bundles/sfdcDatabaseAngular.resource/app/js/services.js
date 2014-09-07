'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', [])
.value('version', '0.1')
.factory('SFDC_SID', ['$window',
	function($window) {
		return $window.appValues.SFDC_SID;
	}
])
.service('AppErrors', ['$sce', function($sce) {
	var svc = this;
	// svc.$sce = $sce;
	svc.errors = [];
	Object.observe(this.errors, console.log);
	svc.removeError = function(errorIndex) {
		// var newErrors = svc.errors.slice();
		svc.errors.splice(errorIndex, 1);
		// svc.errors = 
	}
}])
.service('AccountState', ['$log', 'sfdc',
	function($log, sfdc) {
		var self = this;
		var accountSoql =
			'SELECT Id, Name, AnnualRevenue__c, Phone__c, Description__c ' +
			// '(SELECT Id, Name FROM Test\Objs__r)' +
			// ' FROM Account' +
			' FROM Account__c' +
			' WHERE AnnualRevenue__c > 0' +
			' LIMIT 5';

		self.mruAccounts = [];
		self.gridOptions = {};

		sfdc.query(accountSoql, undefined, {
			useJsr: true
		}).then(function(accounts) {
			angular.copy(accounts, self.mruAccounts);
		});
		// sfdc.query(accountSoql, undefined, {
		// 	useJsr: true,
		// 	vfrVia$Http: true
		// }).then(function(accounts) {
		// 	angular.copy(accounts, self.mruAccounts);
		// });

		// sfdc.query(accountSoql, undefined, {
		// 	useJsr: false
		// }).then(function(accounts) {
		// 	angular.copy(accounts, self.mruAccounts);
		// });


		self.gridOptions = {
			data: 'accounts',
			enableCellSelection: true,
			enableRowSelection: false,
			enableCellEdit: true,
			columnDefs: [{
				field: 'Id',
				enableCellEdit: true
			}, {
				field: 'Name',
				enableCellEdit: true
			}, {
				field: 'AnnualRevenue',
				enableCellEdit: true
			}]
		};
	}
]);
