# xsd-schema-validator


A (XSD) schema validator for [NodeJS](nodejs.org) that uses [Java](https://www.java.com) to perform the actual schema validation.


## Prerequisites

Declare a `JAVA_HOME` environment variable that points to an installed JDK.


## Use

```
var validator = require('xsd-schema-validator');

var xmlStr = '<foo:bar />';

validator.validateXML(xmlStr, 'resources/foo.xsd', function(err, result) {
  if (err) {
    throw err;
  }

  result.valid; // true
});
```

## Why

Because Java can do schema validation and NodeJS cannot.


## License

MIT