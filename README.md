# xsd-schema-validator

[![CI](https://github.com/nikku/node-xsd-schema-validator/workflows/CI/badge.svg)](https://github.com/nikku/node-xsd-schema-validator/actions?query=workflow%3ACI)

A (XSD) schema validator for [NodeJS](nodejs.org) that uses [Java](https://www.java.com) to perform the actual validation. [:arrow_right: Why?](#why)


## Prerequisites

Under the hood, this utility uses Java to do the actual validation. 

It assumes that `javac` and `java` are on the path. If a `JAVA_HOME` environment variable exists it uses that to locate an installed JDK. 

On some platforms, i.e. [Mac OSX](http://www.mkyong.com/java/how-to-set-java_home-environment-variable-on-mac-os-x/) you need to define `JAVA_HOME` manually.


## Installation

Install the package via [npm](http://npmjs.org):

```
npm install --save xsd-schema-validator
```


## Usage

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

You may validate readable streams:

```javascript
var xmlStream = fs.createReadableStream('some.xml');

validator.validateXML(xmlStream, ...);
```

You may validate files, too:

```javascript
validator.validateXML({ file: 'some.xml' }, ...);
```

## Why

Because Java can do schema validation and NodeJS cannot.


## License

MIT
