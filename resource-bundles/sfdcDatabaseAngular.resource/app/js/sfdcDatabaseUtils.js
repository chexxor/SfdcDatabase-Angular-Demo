'use strict';

angular.module('sfdcDatabase')
	.provider('sfdcDatabaseUtils', function() {

		var config = this;

		// User-configurable.
		config.extend = function extend(masterObj, secondaryObj) {
			var masterObj_ = angular.copy(masterObj);
			for (var attrname in secondaryObj) {
				masterObj_[attrname] = secondaryObj[attrname];
			}
			return masterObj_;
		}

		// User-configurable.
		config.omit = function omit(object, props) {
			for (var i in object) {
				if (props.indexOf(i) != -1) {
					delete object[i];
				}
			}
			return object;
		}

		return {
			$get: [function() {
				return {
					extend: config.extend,
					omit: config.omit
				};
			}]
		}
	});