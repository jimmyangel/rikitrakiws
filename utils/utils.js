'use strict';

var sanitizeHtml = require('sanitize-html');

module.exports =  {
	sanitize: function (dirty, restricted) {
		if (dirty) {
			var clean = sanitizeHtml(dirty, restricted ? {allowedTags: [], allowedAttributes: []} : {allowedTags: ['a', 'li'], allowedAttributes: {'a': [ 'href', 'target' ]}});
			return clean;
		}
	}
};