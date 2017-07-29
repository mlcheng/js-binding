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
	 * The private property holding data-binding information
	 * This is injected into all consumed objects
	 * @type {Object}
	 */
	const IQDB = {
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
			bindWrapped: {
				cc: 'iqBindWrapped',
				dash: 'data-iq-bind-wrapped'
			}
		}
	};

	/**
	 * A map of HTML elements and properties that may fire object model changes
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
	 * Stringify a string to a more human readable format
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
	 * Maps object external names to actual objects
	 * Used with the Model() call
	 * @type {Object}
	 */
	let _NAMEMAP = {};

	function _createMapping(objName, obj) {
		_NAMEMAP[objName] = obj;
	}

	function _getMappingByName(objName) {
		return _NAMEMAP[objName];
	}

	/**
	 * Inject the `__iqdb` property into the object
	 * This is used to store all internal iQwerty data-binding information, including the data model
	 * @param  {Object} obj The object to inject into
	 */
	function _injectIQDB(obj) {
		if(!obj.hasOwnProperty(IQDB.iqdb)) {
			obj[IQDB.iqdb] = {};
		}
	}

	/**
	 * Initialize the `__iqdb` object for an object
	 * The object will then look like:
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
	 * @param  {[type]} obj  [description]
	 * @param  {[type]} prop [description]
	 * @return {[type]}      [description]
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
	 * Update the data bindings for the property
	 * @param  {Object} obj      The object
	 * @param  {String} prop     The property to update bindings for
	 * @param  {Object} bindings A data binding, see _initializeIQDBFor() for an example
	 */
	function _updateBindings(obj, prop, bindings) {
		let oprop = obj[IQDB.iqdb][prop];

		bindings.forEach(binding => {
			let existing = oprop[IQDB.bindings].find(b => b[IQDB.el] === binding[IQDB.el]);
			if(existing) {
				// Element exists, just add attributes
				binding[IQDB.attrs] = binding[IQDB.attrs].filter(
					attr => !~existing[IQDB.attrs].indexOf(attr)
				);

				existing[IQDB.attrs].push(...binding[IQDB.attrs]);
			} else {
				// New element
				oprop[IQDB.bindings] = oprop[IQDB.bindings].concat(binding);

				/*
				Since it's a new element, we add changers if applicable
				 */

				let selector = Object.keys(CHANGERS).find(s => {
					let children = Array.from(binding[IQDB.el].parentElement.querySelectorAll(s));
					return !!children.find(child => child === binding[IQDB.el]);
				});
				if(selector) {
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
	 * Update any binding watchers
	 * @param  {Object} obj      The object
	 * @param  {String} prop     The property to add a watcher to
	 * @param  {Function} watchers A function callback that is called when the property changes. It will receive the `newValue` and `oldValue` as parameters
	 */
	function _updateWatchers(obj, prop, watchers) {
		let oprop = obj[IQDB.iqdb][prop];
		oprop[IQDB.watchers] = oprop[IQDB.watchers].concat(...watchers);
	}

	/**
	 * Notify watchers when the object property changes
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
	 * Setup data binding using Object.defineProperty
	 * @param  {Object} obj  The object to initialize data binding for
	 * @param  {String} prop The property to watch
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

	function _updateViews(obj, prop, value) {
		if(value == null) {
			value = '';
		}

		obj[IQDB.iqdb][prop][IQDB.bindings].forEach(binding => {
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
	 * @param  {String} text The string to look for
	 * @param  {HTMLElement} el   A basic starting point to look for the string
	 * @return {HTMLElement}      Returns the nearest container of the string
	 */
	function _getContainerOf(text, el) {
		return Array.from(el.querySelectorAll('*')).find(
			child => !child.firstElementChild && child.textContent === text
		) || el;
	}

	function _wrapHandlebars(el) {
		let exp = new RegExp(IQDB.regex.obj, 'g');
		let html = el.innerHTML;
		html = html.replace(exp, function(match) {
			let container = _getContainerOf(match, el);
			if(IQDB.dataset.bindIncomplete.cc in container.dataset) {
				return match;
			}

			return `<span ${IQDB.dataset.bindIncomplete.dash}>${match}</span>`;
		});
		if(el.innerHTML !== html) el.innerHTML = html;
	}

	/**
	 * Parse elements with `data-iq-bind-to`
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
	 * Parse elements with `data-iq-bind`
	 * Either EVERYTHING or NOTHING in the attribute!
	 */
	function _parseBind() {
		let els = document.querySelectorAll(`[${IQDB.dataset.bind.dash}]:not([${IQDB.dataset.bindWrapped.dash}]`);

		const __performBind = function(obj, prop, el) {
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
				let { obj, prop } = _findObj(el.dataset[IQDB.dataset.bind.cc], IQDB.regex.variable);
				__performBind(obj, prop, el);
			}

			el.dataset[IQDB.dataset.bindWrapped.cc] = 'true';
		});

		els = document.querySelectorAll(`[${IQDB.dataset.bindIncomplete.dash}]`);
		Array.from(els).forEach(el => {
			let { obj, prop } = _findObj(el.innerHTML, IQDB.regex.obj);

			__performBind(obj, prop, el);
		});
	}

	/**
	 * Find the object and properties in a string
	 * @param  {String} string The obj/prop string, e.g. person.name.first
	 * @param  {String} regex  A regex string to use to look for the obj/prop pair
	 * @return {Object}        Returns an object containing the object and property
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

		// Update views first so that a change is not necessary for first bind
		_updateViews(obj, prop, _getModelValue(obj, prop));
	}

	function Watch(obj, prop, watchers) {
		Bind(obj, prop, null, watchers);
	}

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