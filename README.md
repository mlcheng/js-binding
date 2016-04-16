# js-binding

Data binding in JavaScript usually means knockout.js or angular.js or some other framework/library. I decided to make my own  data binding library just to see what would happen.

A demo is available on my [playground](https://www.michaelcheng.us/playground/lib-js/binding/).

## Usage
Usage of this library has become much simpler since the first release. There are many ways to bind data, but let's take a look at the easiest first.

```html
<div data-iq-bind-scope>{person.name} is {person.age} years old!</div>
```

You may also bind the object to the scope for simpler HTML.

```html
<div data-iq-bind-scope="person">{name} is {age} years old!</div>
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

## Advanced usage
There are a few ways you can bind data using the iQwerty data binding library. Keeping the `person` object as an example

```javascript
let person = {
	name: 'Michael'
};
```

### Attributes
Data can be bound using the `iq-bind` attribute.

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
iqwerty.binding.Bind(person, 'name', document.getElementById('name'));
```

Where our template looks like this

```html
<div id="name"></div>
```

The `name` would then be bound to this `<div>`.

It is also possible to bind data to an array of elements

```javascript
iqwerty.binding.Bind(person, 'name', [document.getElementById('el1'), document.getElementById('el2')]);
```

Where the template looks like

```html
<div id="el1"></div>
<div id="el2"></div>
```

### Watchers
A watcher function can also be bound to the object changes.

```javascript
iqwerty.binding.Watch(person, 'name', (newValue, oldValue) => console.log(newValue, oldValue));
```

The callback function will receive the new and old value of the object.