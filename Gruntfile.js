/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' + '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' + ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    clean: ['dist'],
    useminPrepare: {
      html: 'index.html',
      uglify: 'uglify',
      options: {
        dest: 'dist'
      }
    },
    copy: {
      main: {
        files: [{
          src: ['index.html'],
          dest: 'dist/index.html'
        }, {
          src: ['index.html'],
          dest: 'dist/index.orig.html'
        }, {
          src: ['lib/**', 'css/**', 'js/**'],
          dest: 'dist/'
        }]
      }
    },
    usemin: {
      html: ['dist/index.html'],
      options: {
        dirs: ['temp', 'dist']
      }
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      }
    },
    jshint: {
      gruntfile: {
        src: 'Gruntfile.js'
      },
      libTest: {
        src: ['js/**/*.js', 'test/**/*.js']
      },
      options: {
        jshintrc: '.jshintrc'
      }
    },
    qunit: {
      files: ['./*tests.html']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      libTest: {
        files: '<%= jshint.libTest.src %>',
        tasks: ['jshint:libTest', 'qunit']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Default task.
  grunt.registerTask('default', ['clean', 'jshint', 'qunit', 'useminPrepare', 'concat', 'uglify', 'copy:main', 'usemin']);

};