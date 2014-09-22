var _ = require('lodash');

var fs = require('fs');
var spawn = require('child_process').spawn;

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
 * Validate a xml file agains the given schema
 *
 * @param  {String}   xml
 * @param  {String}   schemaLocation the location of the schema
 * @param  {Function} callback to be invoked with (err, result)
 */
function validateXML(xml, schema, callback) {

  withValidator(function(err) {

    if (err) {
      return callback(err);
    }

    var validator = spawn(JAVA, [ '-cp', BASE_DIR, 'support.XMLValidator', '-stdin', '-schema=' + schema ]);

    var result, code;

    var messages = [];

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
      }
    }

    function buildError(result) {
      var msg = 'invalid xml (status=' + result + ')';
      _.forEach(messages, function(m) {
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
}

module.exports.validateXML = validateXML;