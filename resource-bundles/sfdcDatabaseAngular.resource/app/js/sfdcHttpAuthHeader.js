'use strict';

/* SFDC HTTP Authorization Header */

// An API key needs to be added to HTTP requests for SFDC data.
//   This service adds the necessary header to those requests.

angular.module('sfdcHttpAuthHeader', []).
value('version', '0.1').
provider('sfdcHttpAuthHeader', function sfdcHttpAuthHeaderProvider() {

    var authorizationKey = '';

    this.setAuthorizationKey = function(key) {
        authorizationKey = key;
    };

    this.$get = ['$log',
        function sfdcHttpAuthHeader($log) {

            var sfdcEndpoints = [
                '/services/proxy',
                '/services/data'
            ];

            return {
                setAuthorizationKey: function(key) {
                    authorizationKey = key;
                    return this;
                },
                request: function(config) {
                    var targetUrl = config.url,
                        isSfdcTarget = sfdcEndpoints.reduce(function(memo, se) {
                            return targetUrl.toLowerCase().indexOf(se.toLowerCase()) != -1 || memo;
                        }, false);
                    if (isSfdcTarget) {
                        config.headers.Authorization = 'Bearer ' + authorizationKey;
                    }
                    return config;
                }
            };
        }
    ];

});
