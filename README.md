# xsd-schema-validator

[![Build Status](https://travis-ci.org/nikku/node-xsd-schema-validator.svg?branch=master)](https://travis-ci.org/nikku/node-xsd-schema-validator)

A (XSD) schema validator for [NodeJS](nodejs.org) that uses [Java](https://www.java.com) to perform the actual validation.


## Prerequisites

This utility assumes that `javac` and `java` are on the path _or_ that
the `JAVA_HOME` environment exists and points to an installed JDK.

On some platforms, i.e. [Mac OSX](http://www.mkyong.com/java/how-to-set-java_home-environment-variable-on-mac-os-x/) you need to define `JAVA_HOME` manually.


## How to Use

Install via [npm](http://npmjs.org):

```
npm install --save xsd-schema-validator
```

Use in your application:

```javascript
var validator = require('xsd-schema-validator');

var xmlStr = '<foo:bar />';

validator.validateXML(xmlStr, 'resources/foo.xsd', function(err, result) {
  if (err) {
    throw err;
  }

  result.valid; // true
});
```

You may validate readable streams, too:

```javascript
var xmlStream = fs.createReadableStream('some.xml');

validator.validateXML(xmlStream, ...);
```

...and files, too:

```javascript
validator.validateXML({ file: 'some.xml' }, ...);
```


## Why

Because Java can do schema validation and NodeJS cannot.


## License

MIT
