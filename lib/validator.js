var fs = require('fs');
var os = require('os');
var path = require('path');

var which = require('which');

var spawn = require('child_process').spawn;

var CLASSPATH_SEPARATOR = os.platform() === 'win32' ? ';' : ':';

var BASE_DIR = path.resolve(__dirname + '/../');

var VALIDATOR = path.resolve(__dirname + '/../support/XMLValidator');

function withJava(executable, callback, debug) {

  if (debug) {
    console.log('Locating %s, JAVA_HOME=%s', executable, process.env.JAVA_HOME);
  }

  var options = process.env.JAVA_HOME
    ? { path: process.env.JAVA_HOME + '/bin' }
    : {};

  return which(executable, options, callback);
}

function onceOnly(callback) {
  var called = false;

  return function() {
    if (called) {
      return;
    }

    called = true;

    callback.apply(null, arguments);
  };
}

function withValidator(callback, debug) {

  callback = onceOnly(callback);

  if (fs.existsSync(VALIDATOR + '.class')) {
    if (debug) {
      console.log('Using existing helper');
    }

    return callback();
  }

  if (debug) {
    console.log('Compiling helper');
  }

  return withJava('javac', function(err, javac) {
    if (err) {
      return callback(
        new Error('Java SDK required at JAVA_HOME or in path to compile validation helper')
      );
    }

    if (debug) {
      console.log('Found javac: %s', javac);
    }

    spawn(javac, [ 'support/XMLValidator.java' ], { cwd: BASE_DIR })
      .on('error', callback)
      .on('exit', function(exitCode) {
        if (exitCode !== 0) {
          return callback(
            new Error('Failed to compile helper (exitCode=' + exitCode + ')')
          );
        }

        if (debug) {
          console.log('Helper compiled');
        }

        return callback();
      });

  }, debug);
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

  this.cwd = options.cwd;
  this.debug = !!options.debug;
}

/**
 * Validate a xml file against the given schema
 *
 * @param {String|Buffer|ReadableStream|Object} xml
 * @param {String} schema path to schema
 * @param {Function} callback to be invoked with (err, result)
 */
Validator.prototype.validateXML = function(xml, schema, callback) {

  callback = onceOnly(callback);

  var cwd = this.cwd,
      debug = this.debug;

  // validate input and set validator mode
  var input;

  // plain string
  if (typeof xml === 'string') {
    input = {
      str: xml
    };
  } else

  // readable stream
  if (typeof xml.pipe === 'function') {
    input = {
      stream: xml
    };
  } else

  // buffer
  if (xml instanceof Buffer) {
    input = {
      buffer: xml
    };
  } else

  // file
  if (xml.file) {
    input = xml;
  }

  if (!input) {
    return callback(
      new Error(
        'unsupported <xml> parameter: ' +
        'expected String|Buffer|ReadableStream|Object={ file: path }'
      )
    );
  }

  function runValidation(java, callback) {

    var validator = spawn(java, [
      '-Dfile.encoding=UTF-8',
      '-classpath',
      [ BASE_DIR, cwd ].join(CLASSPATH_SEPARATOR),
      'support.XMLValidator',
      input.file ? '-file=' + input.file : '-stdin',
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

    validator.on('error', function(err) {
      callback(err);
    });

    validator.on('exit', function(exitCode) {
      code = exitCode;

      finish(result ? result : code ? 'WITH_ERRORS' : 'OK', code);
    });

    validator.stderr.on('data', handleText);
    validator.stdout.on('data', handleText);


    var stdin = validator.stdin;

    if (input.stream) {
      input.stream.on('end', function() {
        input.stream.unpipe(stdin);
      });

      return input.stream.pipe(stdin);
    }

    if (input.str) {
      stdin.write(input.str);
    }

    if (input.buffer) {
      stdin.write(input.buffer.toString());
    }

    // end input
    stdin.end();
  }

  withValidator(function(err) {

    if (err) {
      return callback(err);
    }

    withJava('java', function(err, java) {
      if (err) {
        return callback(
          new Error('Java JRE required at JAVA_HOME or in path to perform validation')
        );
      }

      if (debug) {
        console.log('Found java: %s', java);
      }

      return runValidation(java, callback);
    }, debug);
  }, debug);
};

module.exports.Validator = Validator;

/**
 * Ensures that the validator is setup to perform actual validation.
 *
 * @param {Function} callback
 */
module.exports.setup = function(callback) {
  var debug = /xsd-schema-validator/.test(process.env.LOG_DEBUG || '');

  withValidator(callback, debug);
};

/**
 * Validate xml based on the given schema.
 *
 * @param {String|ReadableStream} xml
 * @param {String} schema
 * @param {Function} callback
 */
module.exports.validateXML = function(xml, schema, callback) {

  var cwd = process.cwd();
  var debug = /xsd-schema-validator/.test(process.env.LOG_DEBUG || '');

  return new Validator({
    cwd: cwd,
    debug: debug
  }).validateXML(xml, schema, callback);
};
