module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  // project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    config: {
      tests: 'test'
    },

    jasmine_node: {
      specNameMatcher: '.*Spec',
      projectRoot: '<%= config.tests %>',
      jUnit: {
        report: true,
        savePath : 'tmp/reports/jasmine',
        useDotNotation: true,
        consolidate: true
      }
    },
    watch: {
      test: {
        files: [ 'lib/validator.js', '<%= config.tests %>/**/*.js'],
        tasks: [ 'jasmine_node']
      }
    }
  });

  // tasks
  
  grunt.registerTask('test', [ 'jasmine_node' ]);
  grunt.registerTask('auto-test', [ 'jasmine_node', 'watch:test' ]);

  grunt.registerTask('default', [ 'test' ]);
};