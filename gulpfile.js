var gulp = require('gulp'),
    minifycss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concatenate = require('gulp-concat'),
    replace = require('gulp-replace');

gulp.task('styles', function(){
    return gulp.src('assets/css/*.css')
        .pipe(concatenate('styles.css'))
        .pipe(gulp.dest('assets/dist/'))
        .pipe(minifycss())
        .pipe(gulp.dest('assets/dist/'));
});

gulp.task('scripts', function(){
    return gulp.src('assets/js/*.js')
        .pipe(uglify())
        .pipe(concatenate('app.js'))
        .pipe(gulp.dest('assets/dist/'));
});

gulp.task('libs-js', function(){
    return gulp.src([
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/bootstrap/dist/js/bootstrap.min.js',
            'node_modules/openlayers/dist/ol.js'
        ])
        .pipe(concatenate('libs.js'))
        .pipe(gulp.dest('assets/dist/'));
});

gulp.task('libs-css', function(){
    return gulp.src([
            'node_modules/bootstrap/dist/css/bootstrap.min.css',
            'node_modules/openlayers/dist/ol.css'
        ])
        .pipe(concatenate('libs.css'))
        .pipe(gulp.dest('assets/dist/'));
});

gulp.task('watch', function(){

    gulp.watch('assets/css/*.css', ['styles']);

    gulp.watch('assets/js/*.js',['scripts']);

});

gulp.task('dist', function(){
    gulp.src([
            'assets/dist/*',
        ])
        .pipe(gulp.dest('dist/assets'));
    gulp.src([
            'index.html'
        ])
        .pipe(replace('assets/dist/', 'assets/'))
        .pipe(gulp.dest('dist/'));
});

gulp.task('default', function() {
    gulp.start('styles', 'scripts');
});