module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
            },
            gc_tmp: {
                files: {
                    'tmp/gc_tmp.min.js': ['js/jquery.js', 'js/jquery-ui-1.10.3.custom.js', 'js/gc.js']
                }
            },
            gc: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    compress: false
                },
                files: {
                    'build/gc.min.js': ['js/ol.js', 'tmp/gc_tmp.min.js']
                }
            }
        },
        csslint: {
            gc: {
                options: {
                    "box-model": false,
                    'adjoining-classes': false
                },
                src: ['css/gc.css']
            }
        },
        cssmin: {
            combine: {
                files: {
                    'build/gc.css': ['css/jquery-ui-1.10.3.custom.min.css', 'ol.css', 'css/gc.css']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
  

    // Default task(s).
    grunt.registerTask('default', ['csslint', 'uglify', 'cssmin']);

};
