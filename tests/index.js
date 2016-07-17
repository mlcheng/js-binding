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
		person.firstName = 'Michael Lee';
	})
	.expect(watcherResult)
	.toBe('Michael Lee');