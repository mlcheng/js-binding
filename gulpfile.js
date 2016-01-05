/***********************************************

  "gulpfile.js"

  Created by Michael Cheng on 12/27/2015 17:33
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

const gulp = require('gulp');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const babel = require('gulp-babel');

gulp.task('default', () => gulp.src('binding.js')
	.pipe(babel())
	.pipe(uglify())
	.pipe(rename({
		extname: '.min.js'
	}))
	.pipe(gulp.dest('./')));