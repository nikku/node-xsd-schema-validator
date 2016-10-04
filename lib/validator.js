const fs = require('fs');
const os = require('os');
const spawn = require('child_process').spawn;
const CLASSPATH_SEPARATOR = os.platform() === 'win32' ? ';' : ':';
const JAVA_HOME = process.env.JAVA_HOME;
const BASE_DIR = __dirname + '/../';
const VALIDATOR = __dirname + '/../support/XMLValidator';
const JAVA = JAVA_HOME + '/bin/java';
const JAVAC = JAVA_HOME + '/bin/javac';


function withValidator(callback) {
  if (!JAVA_HOME) {
    callback(new Error('JAVA_HOME is not defined'));
  } else if (!fs.existsSync(JAVAC) && !fs.existsSync(JAVAC + '.exe')) {
    callback(new Error('JDK required at JAVA_HOME to compile helper'));
  } else {
    if (fs.existsSync(VALIDATOR + '.class')) {
      callback();
    } else {
      spawn(JAVAC, ['support/XMLValidator.java'], { cwd: BASE_DIR }).on('exit', callback);
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
  this.debug = options.debug || false;
  this.Encoding = options.encoding || false;
  this.EncodingType = options.encodingType || 'UTF-8';
  this.heapSize = options.heapSize || false;

  return this;
}

/**
 * Validate a xml file agains the given schema
 *
 * @param  {String}   xml
 * @param  {String}   schemaLocation the location of the schema
 * @param  {Function} callback to be invoked with (err, result)
 */
Validator.prototype.validateXML = function(xml, schema, callback) {
  const cwd = this.cwd;
  const debug = this.debug;
  const encoding = this.Encoding;
  const encodingType = this.EncodingType;
  const heapSize = this.heapSize;

  withValidator(function(err) {
    if (err) {
      return callback(err);
    }

    const thisOptions = [
      '-classpath',
      [BASE_DIR, cwd].join(CLASSPATH_SEPARATOR),
      'support.XMLValidator',
      '-stdin',
      '-schema=' + schema
    ];

    if (encoding) {
      thisOptions.push('-Dfile.encoding=' + encodingType);
    }

    if (heapSize) {
      thisOptions.push('-Xmx' + heapSize + 'm');
    }

    const validator = spawn(JAVA, thisOptions, { cwd: cwd });
    const messages = [];
    var result,
      code;

    function finish(result, code) {
      const success = !code;
      const err = success ? null : buildError(result);
      callback(err, {
        valid: success,
        result: result,
        messages: messages
      });
    }

    function handleText(data) {
      const msg = data.toString('utf-8');

      if (msg.indexOf('[') === 0) {
        messages.push(stripLineEnding(msg));
      } else if (msg.indexOf('result=') === 0) {
        result = stripLineEnding(msg.slice('result='.length));
        if (code !== undefined) {
          finish(result, code);
        }
      } else {
        if (debug) {

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
    const stdin = validator.stdin;

    // Check if incoming is stream or not
    if (typeof (xml) === 'string' || typeof (xml) === 'object') {
      stdin.write(xml);
      stdin.write('\n---end---\n');
    } else { // stream
      xml.pipe(stdin);
      xml.on('end', function() {
        xml.unpipe(stdin);
        xml.on('unpipe', function() {
          stdin.write('\n---end---\n');
        });
      });
    }
  });
};

module.exports = Validator;

module.exports.validateXML = function(xml, schema, callback) {
  return new Validator().validateXML(xml, schema, callback);
};