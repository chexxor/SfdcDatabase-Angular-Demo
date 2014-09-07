'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
	'ngRoute',
	'ngResource',
	'ngSanitize',
	'myApp.filters',
	'myApp.services',
	'myApp.directives',
	'myApp.controllers',
	'sfdcTemplateProcessor',
	'sfdcHttpAuthHeader',
	'sfdcHttpSobjectRestResourceProxy',
	'sfdcHttpForceSitesRewriter',
	'sfdcDatabase',
	'trNgGrid',
	'xeditable'
])
// .constant('VF_NAMESPACE', 'apex')
.constant('VF_NAMESPACE', 'SfdcDatabaseAngular')
.constant('SFTEMPLATES_TO_PRECACHE', [
	{
		name: '/apex/SfdcDatabaseAngular_Demo1',
		requestor: 'view'
	}, {
		name: '/apex/SfdcDatabaseAngular_About',
		requestor: 'view'
	}, {
		name: '/apex/SfdcDatabaseAngular_Api',
		requestor: 'view'
	}, {
		name: '/apex/SfdcDatabaseAngular_Comparison',
		requestor: 'view'
	}, {
		name: '/apex/SfdcDatabaseAngular_Status',
		requestor: 'view'
	}
])
.constant('FORCE_SITES_URLS', [
	'/services/data/',
	'/services/proxy',
	'/services/apexrest/',
	'/apexremote'
])
.config(['sfdcTemplateProcessorProvider', 'SFTEMPLATES_TO_PRECACHE', 'VF_NAMESPACE',
	function(sfdcTemplateProcessorProvider, SFTEMPLATES_TO_PRECACHE, VF_NAMESPACE) {
		// Process HTML templates served by Visualforce to be useable by Angular.
		// - View templates from VF are slow because they contain unneeded script tags,
		//   so we must strip those before Angular uses them.
		// - Directives throw an error if the template has more than one root node,
		//   so we pluck the body before giving them to Angular.
		sfdcTemplateProcessorProvider.setVfNamespace(VF_NAMESPACE);
		sfdcTemplateProcessorProvider.addVfPages(SFTEMPLATES_TO_PRECACHE);
	}
])
.config(['sfdcHttpForceSitesRewriterProvider', 'FORCE_SITES_URLS', 'VF_NAMESPACE',
	function(sfdcHttpForceSitesRewriterProvider, FORCE_SITES_URLS, VF_NAMESPACE) {
		// If a VF page is hosted on Force.com Sites, we must add a namespace
		//   to every path on that endpoint.
		sfdcHttpForceSitesRewriterProvider.setVfNamespace(VF_NAMESPACE);
		sfdcHttpForceSitesRewriterProvider.addForceSitesUrls(FORCE_SITES_URLS);
	}
])
.config(['$httpProvider',
	function($httpProvider) {
		$httpProvider.interceptors.push('httpLogger');
		$httpProvider.interceptors.push('sfdcTemplateProcessor');
		$httpProvider.interceptors.push('sfdcHttpSobjectRestResourceProxy');
		$httpProvider.interceptors.push('sfdcHttpForceSitesRewriter');
		$httpProvider.interceptors.push('sfdcHttpAuthHeader'); // Must be after proxy interceptor.
	}
]).
config(function($logProvider) {
	$logProvider.debugEnabled(false);
}).
config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.when('/about', {
			templateUrl: '/apex/SfdcDatabaseAngular_About',
			controller: 'AboutCtrl'
		});
		$routeProvider.when('/demo', {
			templateUrl: '/apex/SfdcDatabaseAngular_Demo1',
			controller: 'HomeCtrl'
		});
		$routeProvider.when('/api', {
			templateUrl: '/apex/SfdcDatabaseAngular_Api',
			controller: 'ApiCtrl'
		});
		$routeProvider.when('/comparison', {
			templateUrl: '/apex/SfdcDatabaseAngular_Comparison',
			controller: 'ComparisonCtrl'
		});
		$routeProvider.when('/status', {
			templateUrl: '/apex/SfdcDatabaseAngular_Status',
			controller: 'StatusCtrl'
		});
		$routeProvider.otherwise({
			redirectTo: '/about'
		});
	}
]).
run(['$rootScope', '$log', '$timeout', 'sfdc', 'AccountState', 'sfdcHttpAuthHeader', 'SFDC_SID',
	function($rootScope, $log, $timeout, sfdc, AccountState, sfdcHttpAuthHeader, SFDC_SID) {

		sfdcHttpAuthHeader.setAuthorizationKey(SFDC_SID);

		AccountState.mruAccounts = [{
			Name: 'Loading...'
		}];

		/*
		$rootScope.$on('$routeChangeStart', function() {
			console.log('Changing route...', arguments);
		});
		$rootScope.$on('$locationChangeStart', function() {
			console.log('Changing route...', arguments);
		});
		$rootScope.$on('$routeChangeSuccess', function() {
			console.log('Changing route...', arguments);
		});
		$rootScope.$on('$routeUpate', function() {
			console.log('Changing route...', arguments);
		});
		*/
		$rootScope.$on('$routeChangeError', function() {
			console.log('Changing route...', arguments);
		});
	}
]);
