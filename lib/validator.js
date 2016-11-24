var fs = require('fs');
var os = require('os');
var path = require('path');

var spawn = require('child_process').spawn;

var CLASSPATH_SEPARATOR = os.platform() === 'win32' ? ';' : ':';

var JAVA_HOME = process.env.JAVA_HOME;

var BASE_DIR = path.resolve(__dirname + '/../');

var VALIDATOR = path.resolve(__dirname + '/../support/XMLValidator');

// Assume jvm/jdk are on the PATH if JAVA_HOME is not set
var JAVA = JAVA_HOME ? JAVA_HOME + '/bin/java' : 'java';
var JAVAC = JAVA_HOME ? JAVA_HOME + '/bin/javac' : 'javac';


function withValidator(callback) {
  if (fs.existsSync(VALIDATOR + '.class')) {
    callback();
  } else {
    if (JAVA_HOME && !fs.existsSync(JAVAC) && !fs.existsSync(JAVAC + '.exe')) {
      callback(new Error('JDK required at JAVA_HOME or in path to compile helper'));
    } else {
      spawn(JAVAC, [ 'support/XMLValidator.java' ], { cwd: BASE_DIR })
        .on('exit', function(exitCode) {
          if (exitCode !== 0) {
            callback(new Error('Failed to compile helper. Is javac on the PATH?'));
          } else {
            callback();
          }
        });
    }
  }
}

function stripLineEnding(str) {
  return str.replace(/[\r\n]+/g, '');
}

/**
 * Pass the current working directory as an argument
 *
 * @param {Object} [options] directory to search for schema resources and includes.
 */
function Validator(options) {
  options = options || {};

  this.cwd = options.cwd || process.cwd();
  this.debug = !!options.debug;
}

/**
 * Validate a xml file against the given schema
 *
 * @param {String|ReadableStream|Object} xml
 * @param {String} schema path to schema
 * @param {Function} callback to be invoked with (err, result)
 */
Validator.prototype.validateXML = function(xml, schema, callback) {

  var cwd = this.cwd,
      debug = this.debug;

  withValidator(function(err) {

    if (err) {
      return callback(err);
    }

    var input = '-stdin';

    if (typeof xml === 'object' && xml.file) {
      input = '-file='+ xml.file;
    }

    var validator = spawn(JAVA, [
      '-Dfile.encoding=UTF-8',
      '-classpath',
      [ BASE_DIR, cwd ].join(CLASSPATH_SEPARATOR),
      'support.XMLValidator',
      input,
      '-schema=' + schema
    ], { cwd: cwd });

    var result, code, messages = [];

    function finish(result, code) {
      var success = !code,
          err = success ? null : buildError(result);

      callback(err, {
        valid: success,
        result: result,
        messages: messages
      });
    }

    function handleText(data) {
      var msg = data.toString('utf-8');

      if (msg.indexOf('[') === 0) {
        messages.push(stripLineEnding(msg));
      } else
      if (msg.indexOf('result=') === 0) {
        result = stripLineEnding(msg.slice('result='.length));

        if (code !== undefined) {
          finish(result, code);
        }
      } else {
        if (debug) {
          console.log(msg);
        }
      }
    }

    function buildError(result) {
      var msg = 'invalid xml (status=' + result + ')';
      messages.forEach(function(m) {
        msg += '\n\t' + m;
      });

      return new Error(msg);
    }

    validator.on('exit', function(exitCode) {
      code = exitCode;

      finish(result ? result : code ? 'WITH_ERRORS' : 'OK', code);
    });

    validator.stderr.on('data', handleText);
    validator.stdout.on('data', handleText);

    var stdin = validator.stdin;

    // handle readable streams
    if (typeof xml.pipe === 'function') {

      xml.on('end', function() {
        xml.unpipe(stdin);
      });

      xml.pipe(stdin);
    }

    // handle string input
    if (typeof xml === 'string') {
      stdin.write(xml);
      stdin.end();
    }
  });
};

module.exports = Validator;

/**
 * Validate xml based on the given schema.
 *
 * @param {String|ReadableStream} xml
 * @param {String} schema
 *
 * @param {Function} callback
 */
module.exports.validateXML = function(xml, schema, callback) {
  return new Validator().validateXML(xml, schema, callback);
};