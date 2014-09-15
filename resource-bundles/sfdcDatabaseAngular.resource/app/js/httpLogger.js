'use strict';

angular.module('myApp')
	.provider('httpLogger', function httpLoggerProvider() {
		this.$get = ['$log', 'httpLog',
			function httpLogger($log, httpLog) {
				return {
					request: function(config) {
						$log.log('Sending $http request:', config);
						httpLog.requests.unshift(config);
						return config;
					},
					response: function(response) {
						$log.log('Received $http response:', response);
						// Find the right request and add the response to it.
						var matchingRequests = httpLog.requests
							.filter(function(req) {
								return !req.response
									&& req.method == response.config.method
									&& req.url == response.config.url;
							});
						$log.log('matching requests: ', matchingRequests);
						matchingRequests.forEach(function(req) {
							req.response = {
								status: response.status,
								data: response.data
							};
						});

						httpLog.responses.unshift(response);
						return response;
					}
				};
			}
		];
	})
	.service('httpLog', [function() {
		var svc = this;
		svc.requests = [];
		svc.responses = [];
	}]);
