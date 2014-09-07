'use strict';

/* SFDC Template Processor */

// This service conforms to the $http service's interceptor API.
// It enables storing HTML templates as Visualforce pages by
//   processing the XHR response to remove extra stuff
//   added by the Visualforce service, such as script tags.

// Sometimes, the Visualforce service doesn't add a `body` tag.
//   Angular directives expects a template to be contained in a single
//   tag, so missing a body tag can cause problems. To solve this, we
//   assume everything after the `head` tag should be the `body` tag
//   contents and return that as the HTTP response.

// Salesforce injects scripts into all Visualforce pages.
//   e.g.:
//   /faces/a4j/g/3_3_3.Finalorg.ajax4jsf.javascript.AjaxScript?rel=1392581006000
//   /static/111213/js/perf/stub.js
// Because we can't disable this, we strip them out before rendering them.
//   If we don't, the browser will take ~250ms to fetch them before
//   the template is rendered.

angular.module('sfdcTemplateProcessor', []).
value('version', '0.1').
provider('sfdcTemplateProcessor', function sfdcTemplateProcessorProvider() {

	// Utility functions.

	function getPath(url) {
		var urlParser = document.createElement('a'); //Use built in js url chunking, no point rolling this ourselves!
		urlParser.href = url;
		return urlParser.pathname;
	}

	function escapeRegexp(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}

	function buildScriptRegex(scriptNames) {
		// Script names may use RexExp-reserved characters. Escape them.
		var scriptNamesEscaped = scriptNames.map(escapeRegexp);
		// Wrap in ".*" to match any part of script name.
		var scriptNamePatterns = scriptNamesEscaped.map(function(s) {
			return '.*' + s + '.*?';
		});
		// Change scripts to Regex pattern options syntax.
		//   e.g. [a, b] -> "(a|b)"
		var scriptNameOptions = "(" + scriptNamePatterns.join('|') + ")";
		var scriptTagPattern = '<script src="' + scriptNameOptions + '"><\/script>';
		var scriptTagRegex = new RegExp(scriptTagPattern, 'gi');
		return scriptTagRegex;
	}

	function stripScriptTags(htmlTemplate) {
		var badScriptRegex = buildScriptRegex(scriptSymbolBlacklist);
		var cleanedHtmlTemplate = htmlTemplate.replace(badScriptRegex, '');
		return cleanedHtmlTemplate;
	}

	function pluckBodyContent(htmlTemplate) {
		var cleanedHtmlTemplate;
		if (htmlTemplate.indexOf('<body') == -1) {
			// If no <body> tag, then take everything after </head>
			var headRegex = /(.|[\n\r])*<\/head>/im;
			cleanedHtmlTemplate = htmlTemplate.replace(headRegex, '');
		} else {
			var bodyContentRegex = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
			var matches = bodyContentRegex.exec(htmlTemplate);
			var bodyContent = matches[1];
			cleanedHtmlTemplate = bodyContent;
		}
		return cleanedHtmlTemplate;
	}

	function replaceNamespace(namespace, url) {
		var returnUrl = '';
		var breadcrumbCount = url.match(/\//g) ? url.match(/\//g).length : 0;
		var hasNamespace = breadcrumbCount >= 2;
		if (hasNamespace) {
			returnUrl = url.replace(/^\/\w*\//, '/' + namespace + '/');
		} else if (breadcrumbCount == 1) {
			returnUrl = '/' + namespace + url;
		} else if (breadcrumbCount === 0) {
			returnUrl = '/' + namespace + '/' + url;
		}
		return returnUrl;
	}


	// Service state.

	// Note: Regex support would be nice. The problem is that JS files have `.`
	//   as part of the file path, which is a symbol reserved by Regex.
	var scriptSymbolBlacklist = [
		'.ajax4jsf.javascript.AjaxScript',
		'/js/perf/stub.js',
		'/sfdc/JiffyStubs.js'
	];
	var vfPages = [];
	var vfNamespace = 'apex';

	// Methods available in app configuration.
	var cfg = this;

	cfg.isForceSites = false;

	// Add substrings which are unique to the script tags you wish to block.
	cfg.addScriptSymbolsToBlacklist = function(scriptSymbols) {
		scriptSymbolBlacklist = scriptSymbolBlacklist.concat(scriptSymbols);
	};

	cfg.addVfPages = function(vfPages_) {
		vfPages = vfPages.concat(vfPages_);
	};

	cfg.setVfNamespace = function(newPath) {
		vfNamespace = newPath;
	}

	this.$get = ['$location', function sfdcTemplateProcessor($location) {
		return {
			request: function(config) {
				var locationPath = getPath($location.absUrl());
				var isForceSites = cfg.isForceSites || (locationPath.split('/')[1] != 'apex');
				if (!isForceSites) {
					return config;
				}

				var targetPath = getPath(config.url);
				var isRegisteredPage = vfPages.reduce(function(memo, page) {
					memo = memo || targetPath.toLowerCase().indexOf(page.name.toLowerCase()) != -1;
					return memo;
				}, false);

				if (isRegisteredPage) {
					// "/apex/MyPageName" => "/namespace/MyPageName"
					config.url = replaceNamespace(vfNamespace, config.url);
				}
				return config;
			},
			response: function(response) {
				// If the url is one of our salesforceTemplateUrls, manipulate the response,
				//   otherwise just return the response
				var responseUrl = getPath(response.config.url);

				// "/namespace/MyPageName" => "/apex/MyPageName"
				var responseUrlNormalized = responseUrl.replace(
						new RegExp('/' + vfNamespace + '/', 'gi'), '/apex/');
				var matchingRegisteredPages = vfPages.filter(function(page) {
					return responseUrlNormalized.toLowerCase().indexOf(page.name.toLowerCase()) != -1;
				});

				if (matchingRegisteredPages.length > 0) {
					// What should we do if multiple matching pages? Just pick one for now.
					var effectiveRegisteredPage = matchingRegisteredPages[0];
					// Useful to everyone.
					response.data = stripScriptTags(response.data);
					response.config.url = responseUrlNormalized;
					// Useful for some things.
					if (effectiveRegisteredPage.requestor == 'directive') {
						response.data = pluckBodyContent(response.data);
					}
				}

				return response;
			}
		};
	}];

});
