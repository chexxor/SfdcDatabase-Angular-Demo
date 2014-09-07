'use strict';

angular.module('myApp').
	provider('httpLogger', function sfdcHttpAuthHeaderProvider() {

    this.$get = ['$log',
        function httpLogger($log) {
            return {
                request: function(config) {
                	$log.log('Sending $http request:', config);
                    return config;
                }
            };
        }
    ];

});
