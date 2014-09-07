'use strict';

/* Filters */

angular.module('myApp.filters', [])
.filter('interpolate', ['version',
	function(version) {
		return function(text) {
			return String(text).replace(/\%VERSION\%/mg, version);
		};
	}
])
.filter('printError', [function() {
	function findInJson(needle, haystack) { 
		var foundNeedles = [];

		if (!haystack || haystack.length === 0) {
			return foundNeedles;
		}
		console.log('finding in haystack', needle, haystack);

		for (var key in haystack) {
			console.log('key', key, haystack);
			if (!haystack.hasOwnProperty(key)) {
				console.log('continuing', haystack[key]);
				continue;
			}
			if (typeof haystack[key] != "string") {
				console.log('recursing...');
				var found = findInJson(needle, haystack[key]);
				found.length > 0 ? foundNeedles.push(found) : null;
				findInJson(needle, haystack[key]);
			}

			if (key == needle) {
				console.log('found');
				foundNeedles.push(haystack[key]);
			}
		}

		return foundNeedles;
	}

	// return findInJson.bind(null, 'error');
	return function(json) {
		return findInJson('error', json);
	};
}])
.filter('prettyJson', function () {
    
    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            var cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }
    
    return syntaxHighlight;
});

