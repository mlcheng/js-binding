/***********************************************

  "binding.js"

  Created by Michael Cheng on 08/11/2016 09:51
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

var iqwerty = iqwerty || {};

iqwerty.binding = (function() {

	/**
	 * Constants for the library.
	 * @type {Object}
	 */
	const IQDB = {
		/**
		 * The private property holding data-binding information, including watchers and views. This is injected into all consumed objects.
		 * @type {Object}
		 */
		iqdb: '__iqdb',

		model: 'model',
		bindings: 'bindings',
		watchers: 'watchers',

		el: 'el',
		attrs: 'attrs',

		changer: 'changer',
		value: 'value',

		regex: {
			dataset: '^data-',
			variable: '([^{}]+)',
			obj: '{ *?([^{}]+) *?}'
		},

		/**
		 * Labels for datasets (HTML data- attributes) in camelCase and selector forms.
		 * @type {Object}
		 */
		dataset: {
			bindIncomplete: {
				cc: 'iqBindIncomplete',
				dash: 'data-iq-bind-incomplete'
			},
			bindTo: {
				cc: 'iqBindTo',
				dash: 'data-iq-bind-to'
			},
			bind: {
				cc: 'iqBind',
				dash: 'data-iq-bind'
			},
			bindComplete: {
				cc: 'iqBindComplete',
				dash: 'data-iq-bind-complete'
			}
		}
	};

	/**
	 * A map of HTML elements and their properties that may fire object model changes. Also includes the property of the element that contains the current value.
	 * @type {Object}
	 */
	const CHANGERS = {
		'input:not([type=checkbox])': {
			[IQDB.changer]: ['change', 'input'],
			[IQDB.value]: 'value'
		},
		'input[type=checkbox]': {
			[IQDB.changer]: ['change', 'input'],
			[IQDB.value]: 'checked'
		},
		'textarea': {
			[IQDB.changer]: ['change', 'input'],
			[IQDB.value]: 'value'
		},
		'[contenteditable]': {
			[IQDB.changer]: ['change', 'input'],
			[IQDB.value]: 'textContent'
		}

	};

	/**
	 * Remove empty objects from array
	 * @param  {Array} arr The array to filter
	 * @return {Array}     Returns an array with empty objects removed
	 */
	const _filter = arr => arr.filter(o => o);

	/**
	 * Stringify an object to a more human readable format.
	 * @param  {String} obj The string to stringify
	 * @return {String}     The JSON string or the original string
	 */
	const _stringify = obj => {
		if(typeof obj === 'string' || typeof obj === 'boolean') {
			return obj;
		} else {
			return JSON.stringify(obj, null, 2);
		}
	};

	/**
	 * Maps object external labels to the actual objects. For example, the label `person` may be bound to the object `thatPerson`, but in the view, it's bound using `<div>{person.name}</div>`.
	 * Used with the Model() call.
	 * @type {Object}
	 */
	let _NAMEMAP = {};

	/**
	 * Creates a mapping from an external label to an object.
	 */
	function _createMapping(objName, obj) {
		_NAMEMAP[objName] = obj;
	}

	/**
	 * Gets the object based on the specified object label.
	 */
	function _getMappingByName(objName) {
		return _NAMEMAP[objName];
	}

	/**
	 * Inject the `__iqdb` property into the object.
	 * This is used to store all internal iQwerty data-binding information, including the data model, views, and watchers.
	 * @param  {Object} obj The object to inject into
	 */
	function _injectIQDB(obj) {
		if(!obj.hasOwnProperty(IQDB.iqdb)) {
			obj[IQDB.iqdb] = {};
		}
	}

	/**
	 * Initialize the `__iqdb` object for an object
	 * The object will then look something like:
	 * {
	 * 	__iqdb: {
	 * 		firstName: {
	 * 			model: 'Michael',
	 * 			bindings: [...{
	 * 				el: [...HTMLElement],
	 * 				attrs: [...String]
	 * 			}],
	 * 			watchers: [...Function]
	 * 		}
	 * 	},
	 * 	...props
	 * }
	 *
	 * The initialized object will only contain the current value.
	 */
	function _initializeIQDBFor(obj, prop) {
		if(!obj[IQDB.iqdb].hasOwnProperty(prop)) {
			obj[IQDB.iqdb][prop] = {
				[IQDB.model]: obj[prop],
				[IQDB.bindings]: [],
				[IQDB.watchers]: []
			};
		}
	}

	/**
	 * Update the bindings for the given property, for example, if a new view is bound to the object.
	 * @param  {Object} obj      The object
	 * @param  {String} prop     The property to update bindings for
	 * @param  {Object} bindings A data binding, see _initializeIQDBFor() for an example
	 */
	function _updateBindings(obj, prop, bindings) {
		let oprop = obj[IQDB.iqdb][prop];

		bindings.forEach(binding => {
			let existing = oprop[IQDB.bindings].find(b => b[IQDB.el] === binding[IQDB.el]);
			if(existing) {
				// Element already exists, just add missing attributes
				binding[IQDB.attrs] = binding[IQDB.attrs].filter(
					attr => !~existing[IQDB.attrs].indexOf(attr)
				);

				existing[IQDB.attrs].push(...binding[IQDB.attrs]);
			} else {
				// Element doesn't exist. Add it to the IQDB.
				oprop[IQDB.bindings] = oprop[IQDB.bindings].concat(binding);

				// Since it's a new element, we add changers if applicable. Don't add changers to elements that already exist, otherwise we'd have too many event listeners for the same event.
				// Find if the current element is anything that triggers changes.
				const selector = Object.keys(CHANGERS).find(s => {
					const possibleMatches = Array.from(
						document.querySelectorAll(s)
					);
					return possibleMatches
						.some(child => child === binding[IQDB.el]);
				});
				if(selector) {
					// Add the event listeners based on the changers for the element.
					CHANGERS[selector][IQDB.changer].forEach(changer => {
						binding[IQDB.el].addEventListener(changer, function() {
							obj[prop] = binding[IQDB.el][CHANGERS[selector][IQDB.value]];
						});
					});
				}
			}
		});
	}

	/**
	 * Update any watchers for the given property.
	 * @param  {Object} obj      The object
	 * @param  {String} prop     The property to add a watcher to
	 * @param  {Function} watchers A function callback that is called when the property changes. It will receive the `newValue` and `oldValue` as parameters
	 */
	function _updateWatchers(obj, prop, watchers) {
		let oprop = obj[IQDB.iqdb][prop];
		oprop[IQDB.watchers] = oprop[IQDB.watchers].concat(...watchers);
	}

	/**
	 * Notify and call watchers when the model changes.
	 * @param  {Object} obj      The object
	 * @param  {String} prop     The property
	 * @param  {Object} newValue The new value of the property
	 * @param  {Object} oldValue The old value of the property
	 */
	function _notifyWatchers(obj, prop, newValue, oldValue) {
		if(newValue === oldValue) return;

		obj[IQDB.iqdb][prop][IQDB.watchers].forEach(watcher => {
			watcher(newValue, oldValue);
		});
	}

	/**
	 * Setup data binding using Object.defineProperty.
	 * @param  {Object} obj  The object to initialize data binding for.
	 * @param  {String} prop The property to watch.
	 */
	function _initializeDataBinding(obj, prop) {
		try {
			Object.defineProperty(obj, prop, {
				get: () => obj[IQDB.iqdb][prop][IQDB.model],
				set(value) {
					let oldValue = _getModelValue(obj, prop);

					_updateModelValue(obj, prop, value);
					_updateViews(obj, prop, value);

					_notifyWatchers(obj, prop, value, oldValue);
				}
			});
		} catch(e) {
			// Already defined
		}
	}

	function _getModelValue(obj, prop) {
		return obj[IQDB.iqdb][prop][IQDB.model];
	}

	function _updateModelValue(obj, prop, value) {
		obj[IQDB.iqdb][prop][IQDB.model] = value;
	}

	/**
	 * Update the views when the model changes. This creates the data binding effect.
	 */
	function _updateViews(obj, prop, value) {
		if(value == null) {
			value = '';
		}

		obj[IQDB.iqdb][prop][IQDB.bindings].forEach(binding => {
			// Find attributes that the value should be bound to and update them if they are different.
			binding[IQDB.attrs].forEach(attr => {
				let el = binding[IQDB.el];
				let isDataset = new RegExp(IQDB.regex.dataset).test(attr);

				if(isDataset) {
					// The attribute is a `data-` attribute
					let replace = attr.replace(new RegExp(IQDB.regex.dataset), '');
					if(el.dataset[replace] !== value) {
						el.dataset[replace] = _stringify(value);
					}
				} else {
					if(el[attr] !== value) {
						el[attr] = _stringify(value);
					}
				}
			});
		});
	}

	/**
	 * Get the container of a specific string
	 * @param  {String} text The string to look for.
	 * @param  {HTMLElement} el   A basic starting point to look for the string.
	 * @return {HTMLElement}      Returns the nearest container of the string.
	 */
	function _getContainerOf(text, el) {
		return Array.from(el.querySelectorAll('*')).find(
			child => !child.firstElementChild && child.textContent === text
		) || el;
	}

	/**
	 * Find all handlebars in the template of the element and wrap them in a span. The binding is incomplete at this point, but the wrapping provides an easy selector to manipulate the value later.
	 */
	function _wrapHandlebars(el) {
		let exp = new RegExp(IQDB.regex.obj, 'g');
		let html = el.innerHTML;
		html = html.replace(exp, match => {
			let container = _getContainerOf(match, el);
			if(IQDB.dataset.bindIncomplete.cc in container.dataset) {
				// If the element is already binding incomplete, then it doesn't need to be re-wrapped. Just return it.
				return match;
			}

			return `<span ${IQDB.dataset.bindIncomplete.dash}>${match}</span>`;
		});

		// Only set the HTML if it is not the same. Fewer reflows FTW.
		if(el.innerHTML !== html) el.innerHTML = html;
	}

	/**
	 * Parse elements with `data-iq-bind-to`. This is used to bind objects to certain attributes of an element. Syntax is as follows:
	 * attr1[,...attr2]:obj.prop[;...attr3...]
	 */
	function _parseBindTo() {
		let els = document.querySelectorAll(`[${IQDB.dataset.bindTo.dash}]`);
		Array.from(els).forEach(el => {
			let dataset = el.dataset[IQDB.dataset.bindTo.cc];

			let pairs = dataset.split(';');
			pairs.forEach(pair => {
				let parts = pair.split(':');
				let attrs = parts[0].split(',');
				attrs = attrs.map(a => a.trim());
				let { obj, prop } = _findObj(parts[1], IQDB.regex.variable);

				// Objects not defined yet, defer to next round
				if(!(obj || prop)) return;

				Bind(obj, prop, {
					[IQDB.el]: el,
					[IQDB.attrs]: attrs
				});
			});
		});
	}

	/**
	 * Parse elements with `data-iq-bind`. This is used to specify that binding takes place within this element or its children. A value can be specified for this property. This value should be the property that is bound to the element. For example, the following two examples produce the same result:
	 *
	 * <div data-iq-bind>{person.name}</div>
	 *
	 * <div data-iq-bind="person.name"></div>
	 */
	function _parseBind() {
		let els = document.querySelectorAll(`[${IQDB.dataset.bind.dash}]:not([${IQDB.dataset.bindComplete.dash}]`);

		/**
		 * Call the external API Bind() for the given object, property, and element. Incomplete bindings are now complete and can be deleted from the element.
		 */
		const __performBind = (obj, prop, el) => {
			// Objects aren't defined yet; defer to next round
			if(!(obj || prop)) return;

			Bind(obj, prop, {
				[IQDB.el]: el,
				[IQDB.attrs]: ['innerHTML']
			});

			delete el.dataset[IQDB.dataset.bindIncomplete.cc];
		};

		Array.from(els).forEach(el => {
			_wrapHandlebars(el);

			if(el.dataset[IQDB.dataset.bind.cc] !== '') {
				// Value is specified in the attribute. Bind that value directly to the element.
				let { obj, prop } = _findObj(el.dataset[IQDB.dataset.bind.cc], IQDB.regex.variable);
				__performBind(obj, prop, el);
			}

			// Binding is now complete.
			el.dataset[IQDB.dataset.bindComplete.cc] = 'true';
		});

		// Incomplete bindings are for elements that use brackets in the template. Those were not handled above. Find those and perform binding on them as well.
		els = document.querySelectorAll(`[${IQDB.dataset.bindIncomplete.dash}]`);
		Array.from(els).forEach(el => {
			let { obj, prop } = _findObj(el.innerHTML, IQDB.regex.obj);

			__performBind(obj, prop, el);
		});
	}

	/**
	 * Find the object and property given a string that represents the object structure.
	 * @param  {String} string The obj/prop string, e.g. person.name.first
	 * @param  {String} regex  A regex string to use to look for the obj/prop pair
	 * @return {Object}        Returns an object containing the object and property, e.g. { obj: person.name, prop: 'first' }
	 */
	function _findObj(string, regex) {
		let match = new RegExp(regex, 'g').exec(string);
		let _o = match[1].trim().split('.');
		let mainObject = _getMappingByName(_o.shift());

		let obj = mainObject, prop;
		if(typeof mainObject !== 'undefined') {
			_o.forEach((o, idx) => {
				if(idx < _o.length - 1) {
					obj = obj[o] || obj[IQDB.iqdb][o][IQDB.model];
				} else {
					prop = o;
				}
			});
		}

		return { obj, prop };
	}

	/**
	 * Binds values to elements, attributes, and watcher functions.
	 */
	function Bind(obj, prop, bindings, watchers) {
		bindings = Array.isArray(bindings) ? bindings : _filter([bindings]);
		watchers = Array.isArray(watchers) ? watchers : _filter([watchers]);

		// Ready
		_injectIQDB(obj);
		_initializeIQDBFor(obj, prop);

		// Get set
		_updateBindings(obj, prop, bindings);
		_updateWatchers(obj, prop, watchers);

		// Go!
		_initializeDataBinding(obj, prop);

		// Update views first so that a change is not necessary for first bind.
		_updateViews(obj, prop, _getModelValue(obj, prop));
	}

	/**
	 * Sets a function to be called whenever a value changes.
	 */
	function Watch(obj, prop, watchers) {
		Bind(obj, prop, null, watchers);
	}

	/**
	 * Maps a label to an object. The label can then be used on template bindings. This call is necessary to provide data for all template binding syntaxes.
	 */
	function Model(models) {
		Object.keys(models).forEach(name => {
			_createMapping(name, models[name]);
		});

		if(typeof document !== 'undefined') {
			setTimeout(() => {
				_parseBindTo();
				_parseBind();
			});
		}
	}

	return {
		Bind,
		Watch,
		Model
	};
})();