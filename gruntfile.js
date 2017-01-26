module.exports = function (grunt) {
	grunt.initConfig({
		concat: {
			dist: {
				src: [
					'static/js/src/constants.js',
					'static/js/src/main.js', 
					'static/js/src/canvas-events.js',
					'static/js/src/api.js',
					'static/js/src/ui.js',
					'static/js/src/app.js'
				],
				dest: 'static/js/dest/concat.js'
			}
		},
		uglify: {
  			files: {
    			src: 'static/js/dest/concat.js',
    			dest: 'static/js/dest/',
    			expand: true,
    			flatten: true,
    			ext: '.min.js'
  			}
		},
		watch: {
    		files: ['**/*'],
    		tasks: ['concat'],
  		},
	});
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.registerTask('default', ['uglify']);
};