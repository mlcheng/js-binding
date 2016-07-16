'use strict';

/* globals require, __dirname, iqwerty */
const inject = require('../../test/inject.js');
const Test = require('../../test/test.js');


inject(__dirname, '../binding.js');

let person = {
	firstName: 'Michael',
	lastName: 'Cheng',
	age: 24
};

iqwerty.binding.Model({ person });

let watcherResult;

Test('Watchers will observe changes')
	.do(() => {
		iqwerty.binding.Watch(person, 'firstName', result => watcherResult = result);
	})
	.do(() => {
		person.firstName = 'Michael Le';
	})
	.expect(watcherResult)
	.toBe('Michael Lee');