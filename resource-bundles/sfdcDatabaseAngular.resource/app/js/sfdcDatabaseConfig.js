'use strict';

angular.module('sfdcDatabase')
	.provider('sfdcDatabaseConfig', function() {

		function getPath(url) {
			var urlParser = document.createElement('a'); //Use built in js url chunking, no point rolling this ourselves!
			urlParser.href = url;
			return urlParser.pathname;
		}

		var config = this;

		config.apiVersion;

		config.isForceSites;

		config.sfdcEndpoints = {
			// REMOTE_ACTION_QUERY: undefined,
			// REMOTE_ACTION_INSERT: undefined,
			// REMOTE_ACTION_UPDATE: undefined
		};

		config.restSobjectResource = {
			// resourceName: undefined,
			// packageNamespace: undefined
		};

		config.jsrConfigDefault = {
			// buffer: true,
			// escape: true,
			// timeout: 30000
		};

		config.transportFlagsDefault = {
			// useJsr: true
		};

		return {
			$get: ['$window', 'sfdcDatabaseUtils', '$location',
				function($window, sfdcDatabaseUtils, $location) {

				var utils = sfdcDatabaseUtils;

				var apiVersion = 'v30.0';

				var path = getPath($location.absUrl());

				var isForceSites = config.isForceSites || (path.split('/')[1] != 'apex');

				var sfdcEndpoints = {
					REMOTE_ACTION_QUERY: $window.sfdcDatabaseConfig.REMOTE_ACTION_QUERY,
					REMOTE_ACTION_INSERT: $window.sfdcDatabaseConfig.REMOTE_ACTION_INSERT,
					REMOTE_ACTION_UPDATE: $window.sfdcDatabaseConfig.REMOTE_ACTION_UPDATE
				};

				var restSobjectResource = {
					resourceName: 'sfdcSobject/v1/',
					packageNamespace: ''
				};
				var restSobjectResource_ = utils.extend(restSobjectResource, config.restSobjectResource);
				var restSobjectResourceUrl = '/services/apexrest/' +
					restSobjectResource_.packageNamespace +
					restSobjectResource_.resourceName;

				var jsrConfigDefault = {
					buffer: true,
					escape: true,
					timeout: 30000
				};

				var transportFlagsDefault = {
					useJsr: false
				};

				return {
					isForceSites: isForceSites,
					apiVersion: config.apiVersion || apiVersion,
					sfdcEndpoints: utils.extend(sfdcEndpoints, config.sfdcEndpoints),
					restSobjectResourceUrl: restSobjectResourceUrl,
					jsrConfigDefault: utils.extend(jsrConfigDefault, config.jsrConfigDefault),
					transportFlagsDefault: utils.extend(transportFlagsDefault, config.transportFlagsDefault)
				};
			}]
		};
	});