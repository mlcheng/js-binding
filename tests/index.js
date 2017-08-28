/***********************************************

  "index.js"

  Created by Michael Cheng on 07/16/2016 17:40
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

/* globals require, __dirname, iqwerty */
const { Test, inject } = require('../../janus/janus.js');
inject(__dirname, '../binding.js');


Test('Watchers will observe changes', ({ expect }) => {
	let person = {
		firstName: 'Michael',
		lastName: 'Cheng',
		age: 24
	};
	iqwerty.binding.Model({ person });

	let watcherResult;
	iqwerty.binding.Watch(person, 'firstName', result => {
		watcherResult = result;
	});

	person.firstName = 'Michael Lee';

	expect(watcherResult).toBe('Michael Lee');
});


Test('Multi-layered objects can be bound', ({ expect }) => {
	let cat = {
		name: 'Garfield',
		age: 7,
		about: {
			hobby: 'eating'
		}
	};
	iqwerty.binding.Model({ cat });

	let watcherResult;
	iqwerty.binding.Watch(cat.about, 'hobby', result => {
		watcherResult = result;
	});

	cat.about.hobby = 'sleeping';
	expect(watcherResult).toBe('sleeping');
})