# js-data_binding

Data binding in JavaScript usually means knockout.js or angular.js or some other framework/library. I decided to make my own (crude) data binding library just to see what would happen.

A demo is available on my [playground](http://www.michaelcheng.us/playground/lib-js/binding/).

## Usage
Usage of this library is much harder than angular. For now, to bind data to an element, you must call

	iqwerty.binding.bind(person, "name", view);

Where `person` is an object

	var person = {
		age: 23,
		name: "Michael"
	};

And `view` is an element

	var view = document.getElementById('view');

## Future
In the future I want to do something similar to angular.js.

	<input type="text" data-iq-model="person.name">
	<div data-iq-bind="person.name"></div>

We'll see how that goes.
