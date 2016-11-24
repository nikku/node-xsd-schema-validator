module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  // project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    config: {
      tests: 'test'
    },

    jasmine_node: {
      specNameMatcher: '.*',
      projectRoot: '<%= config.tests %>'
    },

    release: {
      options: {
        tagName: 'v<%= version %>',
        commitMessage: 'chore(project): release v<%= version %>',
        tagMessage: 'chore(project): tag v<%= version %>'
      }
    },

    clean: [
      'support/XMLValidator.class'
    ],

    watch: {
      test: {
        files: [ 'lib/validator.js', '<%= config.tests %>/**/*.js'],
        tasks: [ 'test' ]
      }
    }
  });


  // tasks

  grunt.registerTask('test', [ 'jasmine_node', 'clean']);
  grunt.registerTask('auto-test', [ 'test', 'watch:test' ]);

  grunt.registerTask('default', [ 'test' ]);
};