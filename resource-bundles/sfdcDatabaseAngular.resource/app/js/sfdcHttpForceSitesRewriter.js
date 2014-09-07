'use strict';

/* SFDC HTTP Authorization Header */

// An API key needs to be added to HTTP requests for SFDC data.
//   This service adds the necessary header to those requests.

angular.module('sfdcHttpForceSitesRewriter', [])
.value('version', '0.1')
.provider('sfdcHttpForceSitesRewriter', function sfdcHttpAuthHeaderProvider() {

	function getPath(url) {
		var urlParser = document.createElement('a'); //Use built in js url chunking, no point rolling this ourselves!
		urlParser.href = url;
		return urlParser.pathname;
	}

	function escapeRegexp(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}

	function instanceFromHost(host) {
		// location.hostname can be of the form 'abc.na1.visual.force.com',
		// 'na1.salesforce.com' or 'abc.my.salesforce.com' (custom domains). 
		// Split on '.', and take the [1] or [0] element as appropriate
		var elements = host.split(".");

		var instance = null;
		if (elements.length == 4 && elements[1] === 'my') {
			instance = elements[0] + '.' + elements[1];
		} else if (elements.length == 3) {
			instance = elements[0];
		} else {
			instance = elements[1];
		}
		return instance;
	}

	function instanceUrl(host) {
		var instance = instanceFromHost(host);
		return "https://" + instance + ".salesforce.com";
	}

	var vfNamespace;
	var forceSitesUrls = [];
	
	// Methods available in app configuration.
	var cfg = this;

	cfg.setVfNamespace = function(vfNamespace_) {
		vfNamespace = vfNamespace_;
	};

	cfg.addForceSitesUrls = function(forceSitesUrls_) {
		forceSitesUrls = forceSitesUrls.concat(forceSitesUrls_);
	}

	this.$get = ['$log', '$location',
		function sfdcHttpForceSitesRewriter($log, $location) {

			return {
				request: function(config) {

					var path = getPath($location.absUrl());
					var isForceSites = (path.split('/')[1] != 'apex');
					if (!isForceSites) {
						return config;
					}

					var targetUrl = config.url;
					var isMatchingUrl = forceSitesUrls.reduce(function(memo, url) {
						memo = memo || targetUrl.toLowerCase().indexOf(url.toLowerCase()) != -1;
						return memo;
					}, false);

					if (isMatchingUrl) {
						var path = getPath(targetUrl);
						var targetPathRegex = new RegExp(escapeRegexp(path), 'gi');
						// "/services/proxy" => "/namespace/services/proxy"
						var urlOnForceSites = targetUrl.replace(targetPathRegex, '/' + vfNamespace + path);
						config.url = urlOnForceSites;
					}

					return config;
				},
				response: function(response) {
					// Replace the vfNamespace with 'apex'.
					var path = getPath($location.absUrl());
					var isForceSites = (path.split('/')[1] != 'apex');
					if (!isForceSites) {
						return response;
					}

					// "/namespace/services/proxy" => "/services/proxy"
					var responseUrl = response.config.url;
					var responseUrlNormalized = responseUrl.replace(
						new RegExp('/' + vfNamespace + '/', 'gi'), '/');
					var isMatchingUrl = forceSitesUrls.reduce(function(memo, url) {
						memo = memo || responseUrlNormalized.toLowerCase().indexOf(url.toLowerCase()) != -1;
						return memo;
					}, false);

					if (isMatchingUrl) {
						response.config.url = responseUrlNormalized;
					}
					return response;
				}
			};
		}
	];

});
