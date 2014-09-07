'use strict';

/* SFDC HTTP Authorization Header */

// An API key needs to be added to HTTP requests for SFDC data.
//   This service adds the necessary header to those requests.

angular.module('sfdcHttpSobjectRestResourceProxy', []).
value('version', '0.1').
// service('SFDC_AUTH_KEY', [

//     function() {
//         this.SFDC_AUTH_KEY = '';
//     }
// ]).
provider('sfdcHttpSobjectRestResourceProxy', function sfdcHttpAuthHeaderProvider() {

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

    this.$get = ['$log', '$location',
        function sfdcHttpSobjectRestResourceProxy($log, $location) {

            return {
                request: function(config) {
                    // config.headers.Authorization = 'Bearer ' + authorizationKey;
                    if (config.url.toLowerCase().indexOf('/services/apexrest/') != -1) {
                    // if (config.url.indexOf('/services/') != -1) {
                        var targetUrl = instanceUrl($location.host()) + config.url;
                        if (config.method == 'POST' || config.method == 'PATCH') {
                            // config.params._HttpMethod = 'PATCH';
                        }
                        var proxyUrl = $location.protocol() + "://" + $location.host() + '/services/proxy';
                        config.headers['SalesforceProxy-Endpoint'] = targetUrl;
                        config.headers['X-User-Agent'] = 'sfdcSobject/v0.1';
                        config.headers['Content-Type'] = config.headers['X-Content-Type'] =
                            (config.method == "DELETE") ? null : 'application/json; charset=UTF-8';
                        config.url = proxyUrl;

                    }
                    return config;
                }
            };
        }
    ];

});
