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
		/**
		 * Bind an object's property to an array of HTML elements.
		 * @param   obj  An object whose property should be bound
		 * @param   prop The property of the object
		 * @param   elem An array of HTML elements that should be bound to the data 
		 * @return       Returns nothing
		 */
		bind: function(obj, prop, elem) {

			/**
			 * value is the HTML attribute where we can retrieve data from, e.g. "value" for input elements, or "innerHTML" for others
			 * @type Array
			 *
			 * listener is the event that is called should changes occur
			 * @type Array
			 */
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

			/*
			Override the getter and setter methods to reflect on the given HTML elements
			 */
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




			for(var i=0;i<elem.length;i++) {
				if(listener[i] != null) {
					var t_val = elem[i][value[i]];
					elem[i].addEventListener(listener[i], function() {
						obj[prop] = elem[0][value[0]]; //yeah something may be wrong here...
					});
				}
			}
			
		},


		/**
		 * These are constants for the name of HTML elements.
		 */
		elements: {
			ELEMENT_INPUT: "input",
			ELEMENT_P: "p",
			ELEMENT_DIV: "div"
		}
	};
})();