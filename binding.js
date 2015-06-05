/***********************************************

  "binding.js"

  Created by Michael Cheng on 05/29/2015 13:44
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

"use strict";

var iqwerty = iqwerty || {};



iqwerty.binding = (function() {
	function bind(obj, prop, elem) {

		/**
		 * Override the getter and setter for the specified property
		 */
		Object.defineProperty(obj, prop, {
			get: function() {

			},

			set: function(val) {
				// find links of the chain that are related to the specified property
				var links = bind.prototype.findLink(obj, prop);

				for(var i=0;i<links.length;i++) {
					var element = bind.prototype.bound[links[i]].elem;
					var v;
					if(element.tagName.toLowerCase() == "input") {
						v = "value";
					} else {
						v = "innerHTML";
					}

					// emulate binding of data to the element
					element[v] = val;


					element = null;
					v = null;
				}

				links = null;
			},

			configurable: true
		});

		// allow the input event to change the data
		if(elem.tagName.toLowerCase() == "input") {
			elem.addEventListener("input", function() {
				obj[prop] = elem.value;
			});
		}

		// add the object to the list of bound elements
		bind.prototype.bound.push({obj:obj, prop:prop, elem:elem});
	};

	/**
	 * Find elements that are bound to the same object.
	 * @param  {Object} obj  The object to find
	 * @param  {String} prop The property of the object
	 * @return {Array}       Returns an array of indices of bind.prototype.bound that are bound together
	 */
	bind.prototype.findLink = function(obj, prop) {
		return bind.prototype.bound.map(function(value, index, array) {
			if(array[index].obj === obj && array[index].prop == prop) {
				return index;
			}
		});
	};

	/**
	 * An array that stores information about which objects are bound together
	 * @type {Array}
	 */
	bind.prototype.bound = [];

	/**
	 * Well...
	 * @return  Returns nothing
	 */
	function bindAll() {
		var elem = document.querySelectorAll("[data-iq-model]");
		for(var i=0;i<elem.length;i++) {
			//yeah...i might need to rethink this
		}
	};


	return {
		bind: function(obj, prop, elem) {
			bind(obj, prop, elem);
		},

		bindAll: bindAll
	};
})();



// this was meant to bind elements with the data-iq-app, data-iq-model, etc. like angular.
document.addEventListener("DOMContentLoaded", iqwerty.binding.bindAll);