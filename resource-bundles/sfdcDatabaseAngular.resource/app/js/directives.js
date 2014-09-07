'use strict';

/* Directives */


angular.module('myApp.directives', []).
constant('version', '0.1').
directive('appVersion', ['version',
    function(version) {
        return function(scope, elm, attrs) {
            elm.text(version);
        };
    }
]);
