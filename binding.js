/***********************************************

  "binding.js"

  Created by Michael Cheng on 05/29/2015 13:44
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

var iqwerty = iqwerty || {};

iqwerty.binding = (function() {

	var OBJECT_EXP = '([^\.]+)\.([^\.]+)';
	var ATTR_BINDING = 'data-iq-bind';
	var HANDLEBAR_BINDING = 'data-iq-bind-scope';

	function Bind(obj, prop, elem) {
		//First change the elem to array if needed
		if(!(elem instanceof Array)) {
			elem = [elem];
		}


		elem.forEach(function(el) {
			/**
			 * Set the initial value for each element
			 * This is so that if the object property already
			 * has a value, it is bound in the beginning
			 */
			Bind.prototype.setElementValue(el, obj[prop]);


			//Allow the input event to change the data
			if(el.tagName.toLowerCase() === 'input') {
				el.addEventListener('input', function() {
					obj[prop] = el.value;
				});
			}


			//Add the object to the list of bound elements
			Bind.prototype.bound.push({ obj: obj, prop: prop, elem: el, '$$id': Bind.prototype.addObjectId(obj)});

			//Set the object values for the getter
			Bind.prototype.setObjects(obj.$$id, prop, obj[prop]);
		});


		/**
		 * Override the getter and setter for the specified property
		 */
		Object.defineProperty(obj, prop, {
			get: function() {
				var key = obj.$$id;
				if(Bind.prototype.objects[key]) {
					return Bind.prototype.objects[key][prop];
				} else {
					return undefined;
				}
			},

			set: function(val) {
				elem.forEach(function(el) {
					Bind.prototype.setter(obj, prop, el, val);
				});
			},

			configurable: true
		});
	}

	/**
	 * Find elements that are bound to the same object.
	 * @param  {Object} obj  The object to find
	 * @param  {String} prop The property of the object
	 * @return {Array}       Returns an array of indices of Bind.prototype.bound that are bound together
	 */
	Bind.prototype.findLink = function(obj, prop) {
		return Bind.prototype.bound.filter(val => val.obj.$$id === obj.$$id && val.prop === prop);
	}

	/**
	 * Set the value to the element
	 * @param {Element} elem  The HTML element to set data to
	 * @param {Object} value The value to set to the element
	 */
	Bind.prototype.setElementValue = function(elem, value) {
		var v = 'innerHTML';
		if(elem.tagName.toLowerCase() === 'input') {
			v = 'value';
		}

		//Emulate binding of data to the element
		elem[v] = value;

		elem = null;
		v = null;
	}

	/**
	 * A unique ID for objects
	 * @type {Number}
	 */
	Bind.prototype.id = 0;

	/**
	 * Sets the unique ID to the objects
	 * @param {Object} obj The object to add an ID to
	 * @return {Number}    Returns the ID that was added
	 */
	Bind.prototype.addObjectId = function(obj) {
		if(obj.$$id !== undefined) return obj.$$id;
		obj.$$id = Bind.prototype.id;
		return Bind.prototype.id++;
	}

	/**
	 * The setter for Bind
	 * @param {Object} obj  The object of the data to bind
	 * @param {Object} prop The property of the object to bind
	 * @param {Element} elem The HTML element to bind data to
	 * @param {Object} val  The new value of the object property
	 */
	Bind.prototype.setter = function(obj, prop, elem, val) {
		var links = Bind.prototype.findLink(obj, prop);
		links.forEach(function(link) {
			Bind.prototype.setElementValue(link.elem, val);
		});

		Bind.prototype.setObjects(obj.$$id, prop, val);

		links = null;
	}

	/**
	 * Set the object values to memory; used for the object getter
	 * @param {Number} key  The ID of the object
	 * @param {String} prop The property to add
	 * @param {Object} val  The value of the property
	 */
	Bind.prototype.setObjects = function(key, prop, val) {
		Bind.prototype.objects[key] = Bind.prototype.objects[key] || {};
		Bind.prototype.objects[key][prop] = val;
	}

	/**
	 * An array that stores information about which objects are bound together
	 * @type {Array}
	 */
	Bind.prototype.bound = [];

	/**
	 * An object that stores the data that is bound
	 * This is used for the getters
	 * @type {Object}
	 */
	Bind.prototype.objects = {};

	/**
	 * Stores the model for data binding attributes
	 * @type {Object}
	 */
	Bind.prototype.model = {};

	/**
	 * Attempts data binding all of the elements
	 * that have the iqBind attribute
	 * NB: iqwerty.binding.Model() must be used with this
	 */
	function BindAttributes() {
		setTimeout(function() {
			var elem = document.querySelectorAll('[' + ATTR_BINDING + ']');
			if(elem.length === 0) return;

			[].slice.call(elem).forEach(function(el) {
				var obj = el.dataset.iqBind;
				var res = new RegExp(OBJECT_EXP).exec(obj);
				if((!res) || !Bind.prototype.model[res[1]]) return;


				Bind(Bind.prototype.model[res[1]], res[2], el);
			});
		}, 0);
	}

	/**
	 * Attempts data binding of elements with handlebars
	 * NB: iqwerty.binding.Model() must be used with this
	 */
	function BindHandlebars() {
		setTimeout(function() {
			var elem = document.querySelectorAll('[' + HANDLEBAR_BINDING + ']');
			if(elem.length === 0) return;

			var IDENTIFIER = 'iq-bind';
			[].slice.call(elem).forEach(function(el) {
				var handlebars = [];

				var exp = '{ *?' + OBJECT_EXP + ' *?}';
				exp = new RegExp(exp, 'g');
				var match;
				do {
					match = exp.exec(el.innerHTML);
					if(match) {
						handlebars.push({
							template: match[0],
							obj: match[1],
							prop: match[2],
							id: Bind.prototype.id++
						});
					}
				} while(match);

				handlebars.forEach(function(handlebar) {
					var _bind = document.createElement('span');
					_bind.classList.add(IDENTIFIER);
					_bind.id = IDENTIFIER + '-' + handlebar.id;
					el.innerHTML = el.innerHTML.replace(handlebar.template, _bind.outerHTML);
				});

				handlebars.forEach(function(handlebar) {
					Bind(Bind.prototype.model[handlebar.obj], handlebar.prop, document.getElementById(IDENTIFIER + '-' + handlebar.id));
				})
			});
		}, 0);
	}

	/**
	 * Parse the page for attribute or handlebar bindings
	 */
	function ParsePage() {
		BindAttributes();
		BindHandlebars();
	}

	/**
	 * Adds the data binding object to the model
	 * @param {Object} models An object containing the data to bind.
	 */
	function Model(models) {
		Object.keys(models).forEach(function(model) {
			Bind.prototype.model[model] = models[model];
		});
	}


	return {
		Bind: Bind,
		BindAttributes: BindAttributes,
		BindHandlebars: BindHandlebars,
		ParsePage: ParsePage,
		Model: Model
	};
})();


//This binds elements with the iq-bind attribute with its data
document.addEventListener('DOMContentLoaded', iqwerty.binding.ParsePage);