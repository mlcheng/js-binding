# js-binding

Data binding in JavaScript usually means knockout.js or angular.js or some other framework/library. I decided to make my own  data binding library just to see what would happen.

A demo is available on my [playground](https://www.michaelcheng.us/playground/lib-js/binding/).

## Usage
Usage of this library has become much more powerful since the last release. There are many ways to bind data, but let's take a look at the easiest first.

```html
<div data-iq-bind>{person.name} is {person.age} years old!</div>
```

You may also bind the object to the scope for simpler HTML.

```html
<div data-iq-bind="person">{name} is {age} years old!</div>
```

You must specify the `iq-bind-scope` attribute in order for the data to be bound. Here, `person` is an object

```javascript
let person = {
	age: 23,
	name: 'Michael'
};
```

To initialize the data binding model, you must call

```javascript
iqwerty.binding.Model({
	person: person
});
```

The property `person` should be the same as the `person` in the handlebars above. To bind more data to the model, simply add it to the model object.

```javascript
iqwerty.binding.Model({
	person: person,
	birthdays: birthdays
});
```

If you're using ES2015, this can be simplified to

```javascript
iqwerty.binding.Model({person, birthdays});
```

You can add data to the binding model at any time.

### Limitations
Only one object layer is allowed, e.g. `person.name.firstName` cannot be bound. However, you can work around this by simply setting a new variable.

```javascript
let name = person.name;
```

And bind that instead.

Additionally, it is highly recommended to bind all data using one call to `iqwerty.binding.Model()`. It is not *necessary*, but if you encounter problems, try this first.

## Advanced usage
There are a few more ways you can bind data using the iQwerty data binding library. Keeping the `person` object as an example

```javascript
let person = {
	name: 'Michael'
};
```

### Attributes
Data can be bound directly using the `iq-bind` attribute.

```html
<div data-iq-bind="person.name"></div>
```

Note that the model binding must also be used here

```javascript
iqwerty.binding.Model({
	person: person
});
```

### Declaratively
Data can also be bound declaratively.

```javascript
iqwerty.binding.Bind(person, 'name', [{
	el: document.getElementById('name'),
	attrs: ['innerHTML', 'title']
}]);
```

Where our template looks like this

```html
<div id="name"></div>
```

The `name` would then be bound to this `<div>`.

The introduction of the `attrs` array brings us to the next powerful feature of iQwerty's data binding library. Data can be bound to any attribute of an HTML element.

```html
<input data-iq-bind-to="value:person.name;title:person.name" type="text">
```

Intuitively, you can see the syntax for the `data-iq-bind-to` attribute is as follows:

`*property*.*value*[;...]`

Additionally, similar to Angular's `ng-if`, we can set a button to be disabled if there is no text (albeit in a clunky manner for now):

```html
<button data-iq-bind-to="disabled:button.disabled">Submit</button>
```

How can we change `button.disabled` based on whether or not the `person.name` has a value? Read on to find out!

### Watchers
A watcher function can also be bound to the object changes.

```javascript
iqwerty.binding.Watch(person, 'name', (newValue, oldValue) => button.disabled = !!newValue);
```

The callback function will receive the new and original value of the object.