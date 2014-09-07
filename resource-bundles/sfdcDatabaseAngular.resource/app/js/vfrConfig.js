'use strict';

angular.module('sfdcDatabase')
	.service('vfrConfig', function() {
		function vfrConfig() {
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
		if (!this.vfrConfig) {
			this.vfrConfig = vfrConfig();
		}
		return this.vfrConfig;
	});