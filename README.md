# xsd-schema-validator


(XSD) schema validator for [NodeJS](nodejs.org) that uses [Java](https://www.java.com) to perform the actual validation.


## Prerequisites

A JVM must be installed.  The JVM location must be in the classpath or saved in the `JAVA_HOME` environment variable.  A JDK must be installed to compile the support class. If you would like to precompile the support class run the following command from the application root directory after xsd-schema-validator is installed.

```
javac ./node_modules/xsd-schema-validator/support/XMLValidator.java
```

Note: on some platforms, i.e. [Mac OSX](http://www.mkyong.com/java/how-to-set-java_home-environment-variable-on-mac-os-x/) you need to define `JAVA_HOME` manually.


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
