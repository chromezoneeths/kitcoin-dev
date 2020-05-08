const gulp = require('gulp');
const {watch} = require('gulp');
const gulpCopy = require('gulp-copy');
const xo = require('gulp-xo');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const {exec} = require('child_process');
const tsProject = ts.createProject('tsconfig.json');

gulp.task('www', () => {
	return gulp.src('./kitcoin-web/www/**')
		.pipe(gulp.dest('./dist-frontend'));
});

gulp.task('jquery', () => {
	return gulp.src('./kitcoin-web/node_modules/jquery/dist/**')
		.pipe(gulp.dest('./dist-frontend/extern/jquery'));
});
gulp.task('fomantic', () => {
	return gulp.src('./kitcoin-web/node_modules/fomantic-ui-css/**')
		.pipe(gulp.dest('./dist-frontend/extern/fomantic'));
});
gulp.task('extern', gulp.parallel('jquery', 'fomantic'));

gulp.task('lint-web', () => {
	return gulp.src('**.*s') // All *script files
		.pipe(xo())
		.pipe(xo.format())
		.pipe(xo.results(results => {
			console.log(`Linting finished with ${results.warningCount} warnings and ${results.errorCount} errors.`);
		}));
});
gulp.task('js', () => {
	return gulp.src('./kitcoin-web//js/**')
		.pipe(gulp.dest('./dist-frontend/'));
});

gulp.task('default-web', gulp.parallel('www', 'extern', gulp.series('lint-web', 'js')));

gulp.task('watch-web', gulp.series('default-web', () => {
	watch('./kitcoin-web/js/**/*.js', gulp.series('js'));
	watch('./kitcoin-web/www/**', gulp.series('www'));
}));

// Backend tasks

gulp.task('ts', () => {
	return tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist-backend'));
});
gulp.task('ejs', () => {
	return gulp.src('./kitcoin/views/**')
		.pipe(gulpCopy('./dist-backend'));
});
gulp.task('static', () => {
	return gulp.src('./kitcoin/static/**')
		.pipe(gulp.dest('./dist-backend/static'));
});
gulp.task('lint-backend', () => {
	return gulp.src('**.*s') // All *script files
		.pipe(xo())
		.pipe(xo.format())
		.pipe(xo.results(results => {
			console.log(`Linting finished with ${results.warningCount} warnings and ${results.errorCount} errors.`);
		}));
});
gulp.task('restart', async cb => {
	const up = await new Promise(resolve => {
		exec('docker-compose top', (err, stdout) => {
			if (err) {
				console.log(err);
			}

			resolve(stdout.length > 1);
		});
	});
	if (up) {
		console.log('Kitcoin is running, rebuilding to apply changes…');
		exec('docker-compose -f docker-compose.yml up --build -d', cb);
	} else {
		console.log('Kitcoin isn’t running, so we won’t start it.');
		cb();
	}
});

gulp.task('default-backend', gulp.parallel([gulp.series('ts', 'restart'), 'ejs', 'static']));
gulp.task('ci', gulp.parallel(['ts', 'ejs', 'static']));

gulp.task('watch-backend', gulp.series('default-backend', () => {
	watch('./kitcoin/src/**/*.ts', gulp.series('lint-backend', 'ts', 'restart'));
	watch('./kitcoin/views/**', gulp.series('lint-backend', 'ejs'));
	watch('./kitcoin/static/**', gulp.series('lint-backend', 'static'));
}));

gulp.task('default', gulp.parallel('default-web', 'default-backend'));
gulp.task('watch', gulp.parallel('watch-web', 'watch-backend'));
