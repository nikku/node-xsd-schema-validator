# xsd-schema-validator


A (XSD) schema validator for [NodeJS](nodejs.org) that uses [Java](https://www.java.com) to perform the actual validation.


## Prerequisites

Ensure a `JAVA_HOME` environment variable exists that points to an installed JDK.

On some platforms, i.e. [Mac OSX](http://www.mkyong.com/java/how-to-set-java_home-environment-variable-on-mac-os-x/) you need to define it manually.


## How to Use

Install via [npm](http://npmjs.org):

```
npm install --save xsd-schema-validator
```

Use in your application:

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
