const fs = require('fs');
const os = require('os');
const path = require('path');

const which = require('which');

const spawn = require('child_process').spawn;

/**
 * @typedef { import('node:stream').Readable } ReadableStream
 */

const CLASSPATH_SEPARATOR = os.platform() === 'win32' ? ';' : ':';

const BASE_DIR = path.resolve(__dirname, '..');

const VALIDATOR = path.resolve(BASE_DIR, 'support/XMLValidator');

async function withJava(executable, debug) {

  if (debug) {
    console.log('Locating %s, JAVA_HOME=%s', executable, process.env.JAVA_HOME);
  }

  const options = process.env.JAVA_HOME
    ? { path: process.env.JAVA_HOME + '/bin' }
    : {};

  return which(executable, options);
}

async function withValidator(debug) {

  if (fs.existsSync(VALIDATOR + '.class')) {
    if (debug) {
      console.log('Using existing helper');
    }

    return;
  }

  if (debug) {
    console.log('Compiling helper');
  }

  const javac = await withJava('javac').catch(err => {
    throw new Error('Java SDK required at JAVA_HOME or in path to compile validation helper');
  });

  if (debug) {
    console.log('Found javac: %s', javac);
  }

  return new Promise((resolve, reject) => {

    spawn(javac, [ 'support/XMLValidator.java' ], { cwd: BASE_DIR })
      .on('error', reject)
      .on('exit', function(exitCode) {
        if (exitCode !== 0) {
          return reject(
            new Error('Failed to compile helper (exitCode=' + exitCode + ')')
          );
        }

        if (debug) {
          console.log('Helper compiled');
        }

        return resolve();
      });

  });
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
 * @param { string|Buffer|ReadableStream|Object } xml
 * @param { string } schema path to schema
 * @param { { insecure?: boolean } } [options]
 *
 * @return Promise<any>
 */
Validator.prototype.validateXML = async function(xml, schema, { insecure } = { }) {

  const cwd = this.cwd;
  const debug = this.debug;

  // validate input and set validator mode
  let input;

  if (typeof xml === 'string') {

    // plain string
    input = {
      str: xml
    };
  } else if (typeof xml.pipe === 'function') {

    // readable stream
    input = {
      stream: xml
    };
  } else if (xml instanceof Buffer) {
    input = {
      buffer: xml
    };
  } else if (xml.file) {

    // file
    input = xml;
  }

  if (!input) {
    throw new Error(
      'unsupported <xml> parameter: ' +
      'expected String|Buffer|ReadableStream|Object={ file: path }'
    );
  }

  function runValidation(java) {

    return new Promise((resolve, reject) => {

      const args = [
        '-Dfile.encoding=UTF-8',
        '-classpath',
        [ BASE_DIR, cwd ].join(CLASSPATH_SEPARATOR),
        'support.XMLValidator',
        insecure ? '-insecure' : null,
        input.file ? '-file=' + input.file : '-stdin',
        '-schema=' + schema
      ].filter(arg => arg);

      const validator = spawn(java, args, { cwd: cwd });

      let result,
          code,
          messages = [];

      function finish(result, code) {
        const success = !code;
        const err = success ? null : buildError(result, messages);

        const data = {
          valid: success,
          result: result,
          messages: messages
        };

        if (err) {
          reject(Object.assign(err, data));
        } else {
          resolve(data);
        }
      }

      function handleText(data) {
        const msg = data.toString('utf-8');

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

      function buildError(result, messages) {
        let msg = 'invalid xml (status=' + result + ')';
        messages.forEach(function(m) {
          msg += '\n\t' + m;
        });

        return new Error(msg);
      }

      validator.on('error', function(err) {
        reject(err);
      });

      validator.on('exit', function(exitCode) {
        code = exitCode;

        finish(result ? result : code ? 'WITH_ERRORS' : 'OK', code);
      });

      validator.stderr.on('data', handleText);
      validator.stdout.on('data', handleText);


      const stdin = validator.stdin;

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
    });
  }

  await withValidator(debug);

  const java = await withJava('java', debug).catch(err => {
    throw new Error(
      'Java JRE required at JAVA_HOME or in path to perform validation'
    );
  });

  if (debug) {
    console.log('Found java: %s', java);
  }

  return runValidation(java);
};

module.exports.Validator = Validator;

/**
 * Ensures that the validator is setup to perform actual validation.
 */
module.exports.setup = function() {
  const debug = /xsd-schema-validator/.test(process.env.LOG_DEBUG || '');

  return withValidator(debug);
};

/**
 * Validate xml based on the given schema.
 *
 * @param { string|ReadableStream|Buffer|{ file: string } } xml
 * @param { string } schema
 * @param { { insecure?: boolean } } [options]
 */
module.exports.validateXML = function(xml, schema, options) {

  const cwd = process.cwd();
  const debug = /xsd-schema-validator/.test(process.env.LOG_DEBUG || '');

  return new Validator({
    cwd,
    debug
  }).validateXML(xml, schema, options);
};
