'use strict';

angular.module('sfdcDatabase')
	.service('jsrConfig', function() {
		function jsrConfig() {
			var scripts = document.getElementsByTagName('script');
			var remotingProviderScripts = Array.prototype.filter.call(scripts, function(s) {
				return s.innerHTML.indexOf('RemotingProviderImpl') != -1;
			});
			if (remotingProviderScripts.length === 0) {
				return null;
			}
			// Parse the JSON config object.
			return JSON.parse(remotingProviderScripts[0].innerHTML.match(/\{.*\}/)[0]);
		}
		if (!this.jsrConfig) {
			this.jsrConfig = jsrConfig();
		}
		return this.jsrConfig;
	});