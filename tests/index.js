/***********************************************

  "index.js"

  Created by Michael Cheng on 07/16/2016 17:40
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

/* globals require, __dirname, iqwerty */
const { Test, inject } = require('../../test/test.js');
inject(__dirname, '../binding.js');


let watcherResult;


let person = {
	firstName: 'Michael',
	lastName: 'Cheng',
	age: 24
};
iqwerty.binding.Model({ person });
Test('Watchers will observe changes')
	.do(() => {
		iqwerty.binding.Watch(person, 'firstName', result => watcherResult = result);
	})
	.do(() => {
		person.firstName = 'Michael Lee';
	})
	.expect(watcherResult)
	.toBe('Michael Lee');


let cat = {
	name: 'Garfield',
	age: 7,
	about: {
		hobby: 'eating'
	}
};
iqwerty.binding.Model({ cat });
Test('Multi-layered objects can be bound')
	.do(() => {
		iqwerty.binding.Watch(cat.about, 'hobby', result => watcherResult = result);
	})
	.do(() => {
		cat.about.hobby = 'sleeping';
	})
	.expect(watcherResult)
	.toBe('sleeping');