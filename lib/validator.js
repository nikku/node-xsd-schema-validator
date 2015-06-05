var fs = require('fs');
var os = require('os');

var spawn = require('child_process').spawn;

var CLASSPATH_SEPARATOR = os.platform() === 'win32' ? ';' : ':';

var JAVA_HOME = process.env.JAVA_HOME;

var BASE_DIR = __dirname + '/../';

var VALIDATOR = __dirname + '/../support/XMLValidator';

var JAVA = JAVA_HOME + '/bin/java';
var JAVAC = JAVA_HOME + '/bin/javac';


function withValidator(callback) {
  if (!JAVA_HOME) {
    callback(new Error('JAVA_HOME is not defined'));
  } else
  if (!fs.existsSync(JAVAC) && !fs.existsSync(JAVAC + '.exe')) {
    callback(new Error('JDK required at JAVA_HOME to compile helper'));
  } else {
    if (fs.existsSync(VALIDATOR + '.class')) {
      callback();
    } else {
      spawn(JAVAC, [ 'support/XMLValidator.java' ], { cwd: BASE_DIR }).on('exit', callback);
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
 * Validate a xml file agains the given schema
 *
 * @param  {String}   xml
 * @param  {String}   schemaLocation the location of the schema
 * @param  {Function} callback to be invoked with (err, result)
 */
Validator.prototype.validateXML = function(xml, schema, callback) {

  var cwd = this.cwd,
      debug = this.debug;

  withValidator(function(err) {

    if (err) {
      return callback(err);
    }

    var validator = spawn(JAVA, [
      '-classpath',
      [ BASE_DIR, cwd ].join(CLASSPATH_SEPARATOR),
      'support.XMLValidator',
      '-stdin',
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
    stdin.write(xml);
    stdin.write('\n---end---\n');
  });
};

module.exports = Validator;

module.exports.validateXML = function(xml, schema, callback) {
  return new Validator().validateXML(xml, schema, callback);
};