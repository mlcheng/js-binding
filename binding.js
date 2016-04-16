/***********************************************

  "binding.js"

  Created by Michael Cheng on 05/22/2015 20:55
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

var iqwerty = iqwerty || {};

iqwerty.binding = (function() {

	var OBJ_ID = '$$id';

	var VAR_EXP = '([^\.}]+)';
	var OBJ_EXP = VAR_EXP + '\.' + VAR_EXP;
	var ATTRIBUTE_BINDING = 'data-iq-bind';
	var HANDLEBAR_BINDING = 'data-iq-bind-scope';
	var WRAPPER_IDEN = 'iq-bind';

	function elementIs(el, type) {
		return !!type.find(_t => el.tagName.toLowerCase() === _t);
	}

	function elementHas(el, attr) {
		return attr.some(_a => el.hasAttribute(_a));
	}

	function Bind(obj, prop, elems, watchers) {
		//Turn elems into an array if not already
		if(!(elems instanceof Array)) {
			elems = [elems];
		}

		//Set an ID for the object first
		Bind.prototype.setId(obj);

		//Update the bindings with the property, elements bound, and current value
		Bind.prototype.updateBindings(obj[OBJ_ID], prop, elems, obj[prop], watchers);

		//Set initial bindings to update the view
		Bind.prototype.updateViews(obj[OBJ_ID], prop);

		//Add event listener for inputs to simulate two-way binding
		elems.forEach(el => {
			if(!el) return;

			if(elementIs(el, ['input', 'textarea']) || elementHas(el, ['contenteditable'])) {
				el.addEventListener('input', () => {
					obj[prop] = el.innerHTML || el.value;
				});
			}
		});

		//Set getters/setters
		Object.defineProperty(obj, prop, {
			get: () => Bind.prototype.Bindings[obj[OBJ_ID]][prop].value,
			set: value => {
				var _obj = Bind.prototype.Bindings[obj[OBJ_ID]][prop];
				Bind.prototype.notifyWatchers(obj[OBJ_ID], prop, value, _obj.value);

				//Set the new value to the binding model
				_obj.value = value;
				Bind.prototype.updateViews(obj[OBJ_ID], prop);
			},
			configurable: true
		});
	}

	/**
	 * Object properties and their respective bound elements
	 *
	 * e.g.
	 * {
	 * 	0: {
	 * 		name: {
	 * 			elems: [elems],
	 * 		 	value: 'Michael'
	 * 		}
	 * 	}
	 * }
	 * @type {Object}
	 */
	Bind.prototype.Bindings = {};

	Bind.prototype.addBinding = (obj) => {
		var bindings = Bind.prototype.Bindings;
		if(bindings[obj[OBJ_ID]]) return;

		bindings[obj[OBJ_ID]] = {};
	};

	/**
	 * Update object bindings. Stores object and HTMLElement relationships
	 * @param  {Number} id    The $$id of the object
	 * @param  {String} prop  The property to be bound
	 * @param  {Array} elems An array containing the HTMLElements to be bound
	 * @param  {Object} value The value of the object
	 * @param  {Function} watchers Any user-defined watcher to observe for changes to the object property
	 */
	Bind.prototype.updateBindings = (id, prop, elems, value, watchers) => {
		var bindings = Bind.prototype.Bindings;
		if(!bindings[id]) {
			bindings[id] = {};
		}
		if(!bindings[id][prop]) {
			bindings[id][prop] = {
				elems: [],
				value: value,
				watchers: []
			};
		}
		//Add the bound elements
		bindings[id][prop].elems.push(...elems);
		if(watchers) {
			bindings[id][prop].watchers.push(watchers);
		}
	};

	/**
	 * Update the views based on the Bindings relationships
	 * @param  {Number} id   The object $$id
	 * @param  {String} prop The property to bind
	 */
	Bind.prototype.updateViews = (id, prop) => {
		var elems = Bind.prototype.Bindings[id][prop].elems;

		var _value;
		elems.forEach(el => {
			if(!el) return;

			if(elementIs(el, ['input', 'textarea'])) {
				_value = 'value';
			} else {
				_value = 'innerHTML';
			}
			var value = Bind.prototype.Bindings[id][prop].value;


			if(el[_value] !== value) {
				el[_value] = value;
			}
		});
	};

	Bind.prototype.notifyWatchers = (id, prop, newValue, oldValue) => {
		var watchers = Bind.prototype.Bindings[id][prop].watchers;
		if(watchers) {
			watchers.forEach(watcher => {
				watcher(newValue, oldValue);
			});
		}
	};

	/**
	 * A unique ID to be used for binding
	 * @type {Number}
	 */
	Bind.prototype._id = 0;
	Bind.prototype.getId = () => Bind.prototype._id++;
	Bind.prototype.setId = obj => {
		if(obj[OBJ_ID] == null) { //Or undefined
			Object.defineProperty(obj, OBJ_ID, {
				value: Bind.prototype.getId()
			});
		}
	};

	function modelsContain(models, object) {
		return !!Object.keys(models).find(model => object === model);
	}

	/**
	 * Binding for elements bound using data-iq-bind attribute
	 * @param {Object} models The binding models from the user, i.e. objects to bind
	 */
	function BindAttributes(models) {
		setTimeout(function() {
			var elems = document.querySelectorAll(`[${ATTRIBUTE_BINDING}]`);
			if(elems.length === 0) return;

			[].slice.call(elems).forEach(el => {
				var literal = el.dataset.iqBind;
				literal = new RegExp(OBJ_EXP).exec(literal);
				if(!literal) return;
				var objName = literal[1];
				if(!modelsContain(models, objName)) return;

				var obj = models[objName];
				Bind(obj, literal[2], el);
			});
		}, 0);
	}

	/**
	 * Binding for elements using handlebars
	 * @param {Object} models The binding models from the user, i.e. objects to bind
	 */
	function BindHandlebars(models) {
		setTimeout(function() {
			var elems = document.querySelectorAll(`[${HANDLEBAR_BINDING}]`);
			if(elems.length === 0) return;


			[].slice.call(elems).forEach(el => {
				var scoped = el.dataset.iqBindScope;
				var exp = '{ *?' + (scoped ? VAR_EXP : OBJ_EXP) + ' *?}';
				exp = new RegExp(exp, 'g');


				var handlebars = [];

				var match;
				do {
					match = exp.exec(el.innerHTML);
					if(!match) continue;
					var objName = scoped || match[1];
					if(!modelsContain(models, objName)) return;
					handlebars.push({
						matched: match[0],
						obj: objName,
						prop: (scoped ? match[1] : match[2]).trim(),
						id: WRAPPER_IDEN + '-' + Bind.prototype.getId()
					});
				} while(match);


				if(handlebars.length === 0) return;
				
				var html = el.innerHTML;
				handlebars.forEach(handlebar => {
					var _bind = document.createElement('span');
					_bind.classList.add(WRAPPER_IDEN);
					_bind.id = handlebar.id;
					html = html.replace(handlebar.matched, _bind.outerHTML);
				});


				//Build the new HTML
				el.innerHTML = html;

				

				//This must be separate from the above
				//If it isn't separated, then the .innerHTML will overwrite the element from before and the reference to the node will be gone.
				handlebars.forEach(handlebar => {
					var obj = models[handlebar.obj];
					var el = document.getElementById(handlebar.id);
					Bind(obj, handlebar.prop, el);

					//Stop id pollution
					el.removeAttribute('id');
				});
			});
		}, 0);
	}

	/**
	 * Set the binding model
	 * Used for attribute and handlebar binding
	 * @param {Object} models A binding object, e.g.
	 * {
	 * 	person: personObject,
	 * 	animal: animalObject
	 * }
	 * 
	 * Then 'person' and 'animal' can be bound
	 */
	function Model(models) {
		Object.keys(models).forEach(model => {
			Bind.prototype.setId(models[model]);
			Bind.prototype.addBinding(models[model]);
		});
		BindAttributes(models);
		BindHandlebars(models);
	}


	function Watch(obj, prop, callback) {
		Bind(obj, prop, null, callback);
	}

	return {
		Bind: Bind,
		Model: Model,
		Watch: Watch
	};
})();