var validator = require('./validator');

var fs = require('fs');

try {
  fs.unlinkSync(__dirname + '/../support/XMLValidator.class');
} catch (err) {

  // ignore
}

validator.setup(function(err) {
  if (err) {
    console.warn('[xsd-schema-validator] failed to compile helper', err);
  } else {
    console.log('[xsd-schema-validator] compiled helper');
  }
});