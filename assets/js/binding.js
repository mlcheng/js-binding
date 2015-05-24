/***********************************************

  "binding.js"

  Created by Michael Cheng on 05/22/2015 20:55
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

"use strict"

var iqwerty = iqwerty || {};

iqwerty.binding = (function() {
	return {
		bind: function(obj, prop, elem) {

			var value = [], listener = [];
			for(var i=0;i<elem.length;i++) {
				switch(elem[i].tagName.toLowerCase()) {
					case iqwerty.binding.elements.ELEMENT_INPUT:
						value[i] = "value";
						listener[i] = "input";
						break;
					case iqwerty.binding.elements.ELEMENT_P:
					case iqwerty.binding.elements.ELEMENT_DIV:
						value[i] = "innerHTML";
						break;
					default:
						break;
				}
			}

			Object.defineProperty(obj, prop, {
				get: function() {
					return elem[0][value[0]];
				},
				set: function(val) {
					for(var i=0;i<elem.length;i++) {
						elem[i][value[i]] = val;
					}
					console.log(obj[prop]);
				},
				configurable: true
			});





			function listenerHelper(val) {
				obj[prop] = val;
			};

			for(var i=0;i<elem.length;i++) {
				if(listener[i] != null) {
					var t_val = elem[i][value[i]];
					elem[i].addEventListener(listener[i], function() {
						obj[prop] = elem[0][value[0]];
					});
				}
			}
			
		},

		elements: {
			ELEMENT_INPUT: "input",
			ELEMENT_P: "p",
			ELEMENT_DIV: "div"
		}
	};
})();