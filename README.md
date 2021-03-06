# js-binding

Data binding in JavaScript usually means Knockout.js or Angular.js or some other framework/library. iQwerty data binding is a simple, no-nonsense library that for easy data binding to your view.

A demo is available on my [playground](https://playground.michaelcheng.us/lib-js/binding/).

## Usage
Usage of this library has become much more powerful since the last release. Note that there is one breaking change since the last release, which is the removal of **partial** `data-iq-bind` attributes. Besides removing the old API, there is now support for multi-layered objects. See below for more details.

There are many ways to bind data, but let's take a look at the easiest first.

```html
<div data-iq-bind>{person.name} is {person.age} years old!</div>
```

You may also bind the object **directly** to the attribute. Partial `data-iq-bind` with a scope is no longer supported. Either bind the entire object or just specify that there is binding to be done.

```html
<!-- This old syntax is NO LONGER supported -->
<!-- <div data-iq-bind="person">{name} is {age} years old!</div> -->

<!-- Bind data directly to the dataset -->
<span data-iq-bind="person.name"></span> is <span data-iq-bind="person.age"></span> years old!
```

Here, `person` is an object

```javascript
const person = {
	age: 23,
	name: 'Michael'
};
```

To initialize the data binding model, you must call

```javascript
iqwerty.binding.model({ person });
```

The property `person` should be the same as the `person` in the handlebars above. To bind more data to the model, simply add it to the model object.

```javascript
iqwerty.binding.model({
	person,
	birthdays,
});
```

You can add data to the binding model at any time.

### Limitations
It is highly recommended to bind all data using one call to `iqwerty.binding.model()`. It is not strictly *necessary*, but if you encounter problems, try binding relevant data with one call.

## Advanced usage
There are a few more ways you can bind data using the iQwerty data binding library. Let's use a more complex `person` object to showcase the new multi-layered feature of iQwerty binding.

```javascript
const person = {
	details: {
		name: {
			first: 'Michael',
			last: 'Cheng',
		},
	},
};
```

### Attributes
Data can be bound directly using the `iq-bind` attribute.

```html
<div data-iq-bind="person.details.name.first"></div>
```

Note that the model binding must also be used here

```javascript
iqwerty.binding.model({ person });
```

### Declaratively
Data can also be bound declaratively.

```javascript
iqwerty.binding.bind(person.details.name, 'first', [{
	el: document.getElementById('name'),
	attrs: ['innerHTML', 'title']
}]);
```

Where our template looks like this

```html
<div id="name"></div>
```

The `name.first` would then be bound to this `<div>`.

The introduction of the `attrs` array brings us to the next powerful feature of iQwerty's data binding library. Data can be bound to any attribute of an HTML element.

```html
<input data-iq-bind-to="value:person.details.name.first;title:person.details.name.last" type="text">
```

Intuitively, the syntax for the `data-iq-bind-to` attribute is as follows:

`attr1[,...attr2]:obj.prop[;...attr3...]`

Data can also be bound to a `data-` attribute by prefixing with `data-`:

`<div data-iq-bind-to="data-name:person.details.name.first"></div>`

This will result in the following HTML element:

`<div data-name="Michael" data-iq-bind-to="[...]"></div>`

Additionally, similar to Angular's `ng-if`, we can set a button to be disabled if there is no text (albeit in a clunky manner for now):

```html
<button data-iq-bind-to="disabled:button.disabled">Submit</button>
```

How can we change `button.disabled` based on whether or not the `person.name` has a value? Watcher functions are a nice way to achieve this.

### Watchers
A watcher function can also be bound to the object changes.

```javascript
iqwerty.binding.watch(person, 'name', (newValue, oldValue) => button.disabled = !!newValue);
```

The callback function will receive the new and original value of the object.