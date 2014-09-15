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
.service('TransportFlags', [function() {
	var svc = this;
	svc.useJsr = true;
	svc.jsrVia$Http = false;
}])
.service('AccountState', ['$log', 'sfdc',
	function($log, sfdc) {
		var svc = this;
		var accountSoql =
			'SELECT Id, Name, AnnualRevenue__c, Phone__c, Description__c ' +
			// '(SELECT Id, Name FROM TestObjs__r)' +
			// ' FROM Account' +
			' FROM Account__c' +
			' LIMIT 5';

		svc.mruAccounts = [];
		svc.gridOptions = {};

		svc.updateAccount = function(account, transportFlags) {
			return sfdc.update(account, undefined, transportFlags).then(function(records) {
				$log.log('Update success: ', records);
			}).catch(function(err) {
				$log.error('Error updating Account:', err);
			});
		};

		svc.addAccount = function(newAccount, transportFlags) {
			var newAccount_ = {
				Name: '',
				AnnualRevenue__c: 0,
				Phone__c: '',
				attributes: {
					type: 'Account__c'
				}
			};
			angular.extend(newAccount, newAccount_);

			return sfdc.insert(newAccount, undefined, transportFlags).then(function(records) {
				$log.log('Insert success:', records);
				newAccount.Id = records[0].id;
				svc.mruAccounts.push(newAccount);
			}).catch(function(err) {
				$log.error('Error inserting Account:', err);
			});
		};

		svc.deleteAccount = function(record, transportFlags) {
			return sfdc.delete(record, undefined, transportFlags).then(function(records) {
				$log.log('Delete success:', records);
				var indexToRemove = _.pluck(svc.mruAccounts, 'Id').indexOf(records[0].id);
				if (indexToRemove == -1) {
					return;
				}
				var removedItems = svc.mruAccounts.splice(indexToRemove, 1);
				return removedItems;
			}).catch(function(err) {
				$log.error('Error deleting Account:', err);
			});
		};

		sfdc.query(accountSoql, undefined, {
			useJsr: true
		}).then(function(accounts) {
			angular.copy(accounts, svc.mruAccounts);
		});


		svc.gridOptions = {
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
