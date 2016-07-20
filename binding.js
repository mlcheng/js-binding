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

	/*
	Model property constants
	 */
	const VALUE = 'value';
	const BINDINGS = 'bindings';
	const EL = 'el';
	const ATTRS = 'attrs';
	const WATCHERS = 'watchers';
	const CHANGER = 'changer';
	const OBJ = 'obj';
	const PROP = 'prop';



	/**
	 * The class to add to binding elements
	 * @type {String}
	 */
	const BINDING_CLASS = 'iq-binding';

	/**
	 * The class to add to elements that aren't bound correctly, e.g. object doesn't exist
	 * @type {String}
	 */
	const BINDING_CLASS_INCOMPLETE = 'iq-binding-incomplete';

	/**
	 * The dataset string for binding to attributes
	 * @type {String}
	 */
	const DATASET_BIND_TO = 'data-iq-bind-to';

	/**
	 * The dataset string for binding data
	 * @type {String}
	 */
	const DATASET_BIND = 'data-iq-bind';



	/**
	 * Regular expression for a data binding variable
	 * @type {String}
	 */
	const VAR_EXP = '([^\.}]+)';

	/**
	 * Regular expression for object.prop notation
	 * @type {String}
	 */
	const OBJ_EXP = VAR_EXP + '\.' + VAR_EXP;



	/**
	 * A map of HTML elements and properties that may fire object model changes
	 * @type {Object}
	 */
	const CHANGERS = {
		'input:not([type=checkbox])': {
			[CHANGER]: ['change', 'input'],
			[VALUE]: 'value'
		},
		'input[type=checkbox]': {
			[CHANGER]: ['change', 'input'],
			[VALUE]: 'checked'
		},
		'textarea': {
			[CHANGER]: ['change', 'input'],
			[VALUE]: 'value'
		}
	};



	/**
	 * Removes empty entries from the array
	 * @param  {Array} array The array to remove empty entries from
	 * @return {Array}       The filtered array
	 */
	const _removeEmpty = array => array.filter(a => !!a);

	/**
	 * The internal identifier for the object
	 * @type {String}
	 */
	const ID = '__id';

	/**
	 * A unique identifier for objects
	 * @type {Number}
	 */
	var _iden = 1;



	/**
	 * The source of truth for data bindings
	 * @type {Object}
	 */
	var _MODEL = {};

	/**
	 * Creates a shell model for the object
	 * @param  {Object} obj The object to create. It must already be tagged.
	 */
	function _createModel(obj) {
		if(_MODEL.hasOwnProperty(obj[ID])) return;
		_MODEL[obj[ID]] = {};
	}

	/**
	 * Create the properties of the object inside the model
	 * @param  {Object} obj  The object
	 * @param  {String} prop The property to create
	 */
	function _createModelProperties(obj, prop) {
		if(_MODEL[obj[ID]].hasOwnProperty(prop)) return;
		_MODEL[obj[ID]][prop] = {
			[VALUE]: obj[prop],
			[BINDINGS]: [],
			[WATCHERS]: []
		};
	}

	/**
	 * Update the model's extras, i.e. bindings and watchers
	 * @param  {Object} obj      The object
	 * @param  {String} prop     The property of the object to update
	 * @param  {Array} bindings An array of bindings
	 * @param  {Array} watchers An array of watcher functions for the object
	 */
	function _updateModelExtras(obj, prop, bindings, watchers) {
		var _prop = _MODEL[obj[ID]][prop];
		/*
		Attach the object bindings
		 */
		if(bindings) {
			bindings.forEach(binding => {
				var existingBinding = _findBindingWithElement(obj, prop, binding[EL]);
				if(existingBinding) {
					/*
					Element exists already
					Just add attributes to existing attributes
					 */
					binding[ATTRS] = binding[ATTRS].filter(attr => ~~existingBinding[ATTRS].indexOf(attr));
					existingBinding[ATTRS] = existingBinding[ATTRS].concat(...binding[ATTRS]);
				} else {
					// A new element, a new binding
					_prop[BINDINGS] = _prop[BINDINGS].concat({
						[EL]: binding[EL],
						[ATTRS]: binding[ATTRS]
					});

					/*
					Since we have an element not seen before,
					we should set changers listeners as well now
					 */
					var selector = Object.keys(CHANGERS)
						.find(_selector => !!binding[EL].parentElement.querySelector(_selector));
					if(selector) {
						CHANGERS[selector][CHANGER].forEach(changer => {
							binding[EL].addEventListener(changer, () => {
								obj[prop] = binding[EL][CHANGERS[selector][VALUE]];
							});
						});
					}

					// Should set iq-binding complete class now, since it should be done
					// TODO: it might NOT be done if there's more than one binding on the element
					_addBindingClass(binding[EL]);
				}
			});
		}

		/*
		Attach watchers to the object's model
		 */
		if(watchers) {
			_prop[WATCHERS] = _prop[WATCHERS].concat(...watchers);
		}
	}

	/**
	 * Update the model's value
	 * @param  {Object} obj   The object
	 * @param  {String} prop  The property of the object to update
	 * @param  {Object} value The value of the object's property
	 */
	function _updateModelValue(obj, prop, value) {
		_MODEL[obj[ID]][prop][VALUE] = value;
	}

	/**
	 * Gets the value of the property
	 * @param  {Object} obj  The object
	 * @param  {String} prop The property to get
	 * @return {Object}      The value of the property
	 */
	function _getModelValue(obj, prop) {
		return _MODEL[obj[ID]][prop][VALUE];
	}

	/**
	 * Update the views that are bound to the object
	 * @param  {Object} obj   The object
	 * @param  {String} prop  The property that should have its views updated
	 * @param  {Object} value The value of the object
	 */
	function _updateViews(obj, prop, value) {
		_MODEL[obj[ID]][prop][BINDINGS].forEach(binding => {
			binding[ATTRS].forEach(attr => {
				if(binding[EL][attr] !== value) {
					binding[EL][attr] = value;
				}
			});
		});
	}

	/**
	 * Notify any watcher functions that the underlying object has changed. Calls the watcher function with (newValue, oldValue) as parameters
	 * @param  {Object} obj      The object
	 * @param  {String} prop     The property that has changed
	 * @param  {Object} newValue The new value of the property
	 * @param  {Object} oldValue The old value of the property
	 */
	function _notifyWatchers(obj, prop, newValue, oldValue) {
		if(newValue === oldValue) return;

		_MODEL[obj[ID]][prop][WATCHERS].forEach(watcher => {
			watcher(newValue, oldValue);
		});
	}

	/**
	 * Find the binding inside the model that shares the same element
	 * @param  {Object} obj  The object
	 * @param  {String} prop The property to check
	 * @param  {HTMLElement} el   The element to check for
	 */
	function _findBindingWithElement(obj, prop, el) {
		return _MODEL[obj[ID]][prop][BINDINGS].find(binding => binding[EL] === el);
	}

	/**
	 * Tag the object with a unique internal identifier
	 * @param  {Object} obj The object to tag
	 */
	function _tag(obj) {
		if(obj.hasOwnProperty(ID)) return;
		obj[ID] = _iden++;
	}



	/**
	 * Maps external object names to object references
	 * {
	 * 	person: {...}
	 * }
	 * @type {Object}
	 */
	var _MAP = {};

	/**
	 * Create the mapping of the object's external name to a reference to the object
	 * @param  {String} objName The object's external name
	 * @param  {Object} obj     The object
	 */
	function _createMapping(objName, obj) {
		_tag(obj);
		_MAP[objName] = obj;
	}

	/**
	 * Gets the object based on the object's external name
	 * @param  {String} objName The external name of the object to retrieve
	 * @return {Object}         Returns the object with the specified name
	 */
	function _getMappingByObjectName(objName) {
		return _MAP[objName];
	}



	/**
	 * Sets the object getter and setter to initialize binding
	 * @param  {Object} obj  The object
	 * @param  {String} prop The property to initialize binding for
	 */
	function _initializeDataBinding(obj, prop) {
		Object.defineProperty(obj, prop, {
			get: () => _getModelValue(obj, prop),
			set: value => {
				// Keep the old value to notify watchers
				var oldValue = _getModelValue(obj, prop);

				_updateModelValue(obj, prop, value);
				_updateViews(obj, prop, value);
				_notifyWatchers(obj, prop, value, oldValue);
			}
		});
	}



	/**
	 * Add the iq-binding class to elements that have been bound already
	 * This implies that the element is binding complete
	 * @param {HTMLElement} el The element to add the class to
	 */
	function _addBindingClass(el) {
		el.classList.add(BINDING_CLASS);
	}

	/**
	 * Remove the iq-binding-incomplete class that is added to bindings that aren't complete (possibly because object isn't available in the model yet)
	 * @param  {HTMLElement} el The element to remove the class from
	 */
	function _removeIncompleteBindingClass(el) {
		el.classList.remove(BINDING_CLASS_INCOMPLETE);
	}



	/**
	 * Get the container of the given text binding
	 * @param  {String} text The text to find
	 * @param  {HTMLElement} el   The HTMLElement to start searching for the container
	 * @return {HTMLElement}      Returns the most immediate element container of the text
	 */
	function _getContainerOf(text, el) {
		return Array.from(el.querySelectorAll('*')).find(
			child => !child.firstElementChild && child.textContent === text
		) || el;
	
	}

	/**
	 * Wrap handlebars inside an element with iq-binding elements to aid binding
	 * @param  {HTMLElement} el The element to replace handlebars
	 * @return {Array}    Returns an array containing the new bindings of the element
	 */
	function _wrapHandlebars(el) {
		var scoped = el.dataset.iqBind;
		var exp = '{ *?' + (scoped ? VAR_EXP : OBJ_EXP) + ' *?}';


		var html = el.innerHTML;
		html = html.replace(new RegExp(exp, 'g'), match => {
			var container = _getContainerOf(match, el);

			if(container.classList.contains(BINDING_CLASS_INCOMPLETE)) {
				return match;
			}

			return `<span class="${BINDING_CLASS_INCOMPLETE}">${match}</span>`;
		});

		/*
		Only modify the DOM if absolutely necessary, since this is a huge performance hit
		Also, modifying the innerHTML may kill old references to elements in the model. Which is a no-no here
		 */
		if(el.innerHTML !== html) {
			el.innerHTML = html;
		}
	}

	/**
	 * Begin actual data binding of handlebars
	 * @param  {HTMLElement} el The HTML element to bind handlebars for
	 * @return {Array}    Returns an array of bindings
	 * {
	 * 	obj: {...},
	 * 	prop: 'name',
	 * 	bindings: {
	 * 		el: <>,
	 * 		attrs: ['innerHTML']
	 * 	}
	 * }
	 */
	function _bindHandlebars(el) {
		var scoped = el.dataset.iqBind;
		var _exp = '{ *?' + (scoped ? VAR_EXP : OBJ_EXP) + ' *?}';

		var els = el.querySelectorAll(`.${BINDING_CLASS_INCOMPLETE}`);
		return Array.from(els).map(el => {
			// Must reset the regex (its internal pointer), otherwise it'll null
			// http://stackoverflow.com/questions/4724701/regexp-exec-returns-null-sporadically
			var exp = new RegExp(_exp, 'g');

			var match = exp.exec(el.innerHTML);
			var obj = _getMappingByObjectName(scoped || match[1].trim());
			if(!obj) return;

			/*
			Handlebars were originally binding incomplete.
			Now that we are here, they should be complete
			Remove the incomplete class
			Note that the complete class is only added when binding is successful (.Bind())
			 */
			_removeIncompleteBindingClass(el);

			return {
				[OBJ]: obj,
				[PROP]: scoped ? match[1].trim() : match[2].trim(),
				[BINDINGS]: {
					[EL]: el,
					[ATTRS]: ['innerHTML']
				}
			};
		});
	}

	/**
	 * Parse the HTML elements that have the data-iq-bind-to attribute.
	 * The syntax of this attribute is as follows:
	 * 
	 * 	'attr1[,attr2]:object.prop[;attr3:object2.prop]'
	 *
	 * The attrs are the attributes that should be bound to the object.prop
	 * 
	 * Note that if 'object' differs from 'object2', then they MUST be bound to the Model during the _same_ call to iqwerty.binding.Model()
	 * This is a limitation due to not(.iq-binding). The binding class applied during the first pass already.
	 */
	function _parseAttributeBindTo() {
		var els = document.querySelectorAll(`[${DATASET_BIND_TO}]:not(.${BINDING_CLASS})`);
		Array.from(els).forEach(el => {

			/*
			Binding attributes can be separated by semicolons
			Different objects can be bound too, but keep note that they must be bound during the SAME call to iqwerty.binding.Model()
			 */
			var pairs = el.dataset.iqBindTo.split(';');

			pairs.forEach(pair => {
				var parts = pair.split(':');

				var attrs = parts[0].split(',');
				attrs = attrs.map(a => a.trim());
				
				var [objName, objProp] = parts[1].split('.');
				var obj = _getMappingByObjectName(objName);
				if(!obj) return;
				

				Bind(obj, objProp, {
					[EL]: el,
					[ATTRS]: attrs
				});
			});
		});
	}

	/**
	 * Parse HTML elements that have the data-iq-bind attribute.
	 * The attribute has the following 3 possibilities
	 *
	 * (empty): the HTML must be bound with {obj.prop}
	 *
	 * (objName): the HTML must be bound with {propOfObjName}
	 *
	 * (objName.objProp): the HTML will be replaced based on binding
	 */
	function _parseAttributeBind() {
		/*
		The reason for not using
			:not(.${BINDING_CLASS})
		is because if an element is already bound and has iq-binding class
		from data-iq-bind-to, then it will always be incomplete because the
		query selector will never find incomplete bindings under iq-binding
		complete ones.

		So, filter it from the children instead
		 */
		var els = document.querySelectorAll(`[${DATASET_BIND}]`);
		Array.from(els).forEach(el => {
			var parts = el.dataset.iqBind.split('.');

			var [objName, objProp] = parts;

			if(objProp) {
				// Has the property, therefore directly bind to the element
				// But first, let me take a selfie!
				// No, first, we should skip it if it's already bound
				if(el.classList.contains(`${BINDING_CLASS}`)) return;
				
				var obj = _getMappingByObjectName(objName);
				if(!obj) return;

				Bind(obj, objProp, {
					[EL]: el,
					[ATTRS]: ['innerHTML']
				});
			} else {
				// Handlebar binding
				// TODO: this is still not as performant/efficient as I hope

				/*
				The only time we wish to do wrapping and binding is when the element is binding complete.

				If the element has a complete child but no incomplete child, the element is binding complete, and therefore can be skipped
				 */
				if(el.querySelector(`.${BINDING_CLASS}`) &&
					!el.querySelector(`.${BINDING_CLASS_INCOMPLETE}`)) {
					return;
				}

				_wrapHandlebars(el);
				
				var bindings = _removeEmpty(_bindHandlebars(el));
				bindings.forEach(binding => {
					Bind(binding[OBJ], binding[PROP], binding[BINDINGS]);
				});
			}
		});
	}



	/**
	 * The main binding operation. Binds object properties to views and watchers
	 * @param {Object} obj      The object to bind
	 * @param {String} prop     The property of the object to bind
	 * @param {Object} bindings A binding or array of bindings, e.g.
	 * {
	 * 	el: HTMLElement
	 * 	attrs: [...]
	 * }
	 * @param {Object} watchers A watcher function or array of watcher functions
	 */
	function Bind(obj, prop, bindings, watchers) {

		// Bindings and watchers should be arrays when used further in the library
		bindings = Array.isArray(bindings) ? bindings : _removeEmpty([bindings]);
		watchers = Array.isArray(watchers) ? watchers : _removeEmpty([watchers]);


		_tag(obj);
		_createModel(obj);
		_createModelProperties(obj, prop);
		_updateModelExtras(obj, prop, bindings, watchers);


		// Define getters and setters for binding to be able to take place
		_initializeDataBinding(obj, prop);


		// Update the views first so that things don't have to change first to be bound
		_updateViews(obj, prop, obj[prop]);

	}

	/**
	 * Watch a object property for changes
	 * @param {Object} obj      The object to watch
	 * @param {String} prop     The property of the object to watch
	 * @param {Object} watchers A watcher function or array of watcher functions
	 */
	function Watch(obj, prop, watchers) {
		Bind(obj, prop, null, watchers);
	}

	/**
	 * Sets up the binding model. This is needed for attribute binding because the object's external name must be known
	 * @param {Object} pairs A map of external object names and the reference to the object itself, e.g.
	 * {
	 * 	person: person
	 * }
	 */
	function Model(pairs) {
		Object.keys(pairs).forEach(name => {
			_createMapping(name, pairs[name]);
			_createModel(pairs[name]);
		});

		if(typeof document !== 'undefined') {
			// Defer before parsing DOM
			setTimeout(() => {
				_parseAttributeBindTo();
				_parseAttributeBind();
			});
		}
	}

	return {
		Bind,
		Watch,
		Model
	};
})();