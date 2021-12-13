var validator = require('..');

var expect = require('chai').expect;

var fs = require('fs');

var BPMN_SCHEMA = 'test/xsd/bpmn/BPMN20.xsd';
var UMLAUT_SCHEMA = 'test/xsd/Umlauts.xsd';
var INCLUDE_SCHEMA = 'test/xsd/Include.xsd';
var IMPORT_SCHEMA = 'test/xsd/Import.xsd';
var OTHER_SCHEMA = 'test/xsd/Other.xsd';

var BPMN_FILE = 'test/diagram.bpmn';
var INVALID_BPMN_FILE = 'test/invalid.bpmn';


describe('validator', function() {


  describe('#setup', function() {

    this.timeout(30000);

    beforeEach(cleanup);


    it('should pre-compile', function(done) {
      validator.setup(done);
    });


    it('should compile on the fly (without prior setup)', function(done) {

      // given
      var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
                '</bpmn2:definitions>';

      validator.validateXML(xml, BPMN_SCHEMA, function(err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.valid).to.be.true;
          done();
        }
      });
    });

  });


  describe('should validate xml string', function() {

    it('valid', function(done) {

      // given
      var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
                '</bpmn2:definitions>';

      validator.validateXML(xml, BPMN_SCHEMA, function(err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.valid).to.be.true;
          done();
        }
      });
    });


    it('invalid', function(done) {

      var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<bpmn2:definitions unknownAttr="BOOO" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
                '</bpmn2:definitions>';

      validator.validateXML(xml, BPMN_SCHEMA, function(err, result) {
        expect(err).to.exist;

        // correct error message
        expect(err.message).match(/Attribute 'unknownAttr' is not allowed to appear in element 'bpmn2:definitions'/);

        // and line number
        expect(err.message).match(/\(1:476\)/);

        done();
      });
    });


    it('with international characters', function(done) {

      var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" name="Obračun potnih stroškov" targetNamespace="http://activiti.org/bpmn">' +
                '</bpmn2:definitions>';

      validator.validateXML(xml, BPMN_SCHEMA, function(err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.valid).to.be.true;
          done();
        }
      });
    });


    describe('with umlaut', function() {

      it('valid', function(done) {
        var xml = (
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Test xmlns="http://umlauts">ü</Test>'
        );

        validator.validateXML(xml, UMLAUT_SCHEMA, function(err, result) {
          expect(result.valid).to.be.true;
          done();
        });
      });


      it('invalid', function(done) {
        var xml = (
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<AÖ xmlns="http://umlauts"></AÖ>'
        );

        validator.validateXML(xml, UMLAUT_SCHEMA, function(err, result) {
          expect(result.valid).to.be.false;
          done();
        });
      });

    });

  });


  describe('should validate XML stream', function() {

    it('valid', function(done) {

      var xmlStream = fs.createReadStream(BPMN_FILE, { encoding: 'UTF-8' });

      validator.validateXML(xmlStream, BPMN_SCHEMA, function(err, result) {

        if (err) {
          done(err);
        } else {
          expect(result.valid).to.be.true;
          done();
        }
      });
    });


    it('invalid', function(done) {

      var xmlStream = fs.createReadStream(INVALID_BPMN_FILE, { encoding: 'UTF-8' });

      validator.validateXML(xmlStream, BPMN_SCHEMA, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

  });


  describe('should validate Buffer', function() {

    it('valid', function(done) {

      var buffer = createBuffer(
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
        '</bpmn2:definitions>'
      );

      validator.validateXML(buffer, BPMN_SCHEMA, function(err, result) {

        if (err) {
          done(err);
        } else {
          expect(result.valid).to.be.true;
          done();
        }
      });
    });


    it('invalid', function(done) {

      var buffer = createBuffer(
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn2:definitions unknownAttr="BOOO" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
        '</bpmn2:definitions>'
      );

      validator.validateXML(buffer, BPMN_SCHEMA, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

  });


  describe('should validate { file }', function() {

    describe('bpmn', function() {

      it('valid', function(done) {

        validator.validateXML({ file: BPMN_FILE }, BPMN_SCHEMA, function(err, result) {

          if (err) {
            done(err);
          } else {
            expect(result.valid).to.be.true;
            done();
          }
        });
      });


      it('invalid', function(done) {

        validator.validateXML({ file: INVALID_BPMN_FILE }, BPMN_SCHEMA, function(err, result) {
          expect(err).to.exist;
          done();
        });
      });

    });


    describe('with include', function() {

      it('valid', function(done) {

        validator.validateXML({ file: 'test/umlauts.xml' }, INCLUDE_SCHEMA, function(err, result) {

          if (err) {
            done(err);
          } else {
            expect(result.valid).to.be.true;
            done();
          }
        });
      });


      it('invalid', function(done) {

        validator.validateXML({ file: 'test/umlauts-invalid.xml' }, INCLUDE_SCHEMA, function(err, result) {
          expect(err).to.exist;
          done();
        });
      });

    });


    describe('with import', function() {

      it('valid', function(done) {

        validator.validateXML({ file: 'test/umlauts.xml' }, IMPORT_SCHEMA, function(err, result) {

          if (err) {
            done(err);
          } else {
            expect(result.valid).to.be.true;
            done();
          }
        });
      });


      it('invalid', function(done) {

        validator.validateXML({ file: 'test/umlauts-invalid.xml' }, IMPORT_SCHEMA, function(err, result) {
          expect(err).to.exist;
          done();
        });
      });

    });


    describe('with xi:include', function() {

      it('valid', function(done) {

        validator.validateXML({ file: 'test/xi-include.xml' }, OTHER_SCHEMA, function(err, result) {

          if (err) {
            done(err);
          } else {
            expect(result.valid).to.be.true;
            done();
          }
        });

      });

      // TODO(nikku): not supported during validation,
      // cf. https://github.com/nikku/node-xsd-schema-validator/issues/10
      it.skip('invalid', function(done) {

        validator.validateXML({ file: 'test/xi-include-invalid.xml' }, OTHER_SCHEMA, function(err, result) {

          expect(err).to.exist;
          done();
        });

      });

    });


    describe('invalid path', function() {

      it.skip('valid', function() {
      });

      it('invalid', function(done) {

        validator.validateXML({ file: 'test/invalid_file_path.xml' }, null, function(err) {
          expect(err).to.exist;
          expect(err.message).match(/invalid file path or file does not exist/);
          done();
        });
      });

    });
  });


  describe('should not validate unsupported type for xml', function() {

    it('valid', function(done) {

      validator.validateXML(['this is not valid'], BPMN_SCHEMA, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

  });


  describe('should handle missing Java', function() {

    var JAVA_HOME;

    beforeEach(function() {
      JAVA_HOME = process.env.JAVA_HOME;
    });

    afterEach(function() {
      process.env.JAVA_HOME = JAVA_HOME;
    });

    var validXML = (
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
      '</bpmn2:definitions>'
    );


    it('Java JRE (validation)', function(done) {

      // given
      process.env.JAVA_HOME = '/no-where';

      // when
      validator.validateXML(validXML, BPMN_SCHEMA, function(err, result) {

        // then
        expect(err).to.exist;

        done();
      });
    });


    it('Java JDK (compilation)', function(done) {

      // given
      process.env.JAVA_HOME = '/no-where';

      // and no pre-compiled binary exists
      cleanup();

      // when
      validator.validateXML(validXML, BPMN_SCHEMA, function(err, result) {

        // then
        expect(err).to.exist;

        done();
      });
    });

  });

});


// helpers ///////////////

function createBuffer(str) {
  return 'from' in Buffer ? Buffer.from(str) : new Buffer(str);
}

function cleanup() {
  try {
    require('fs').unlinkSync(__dirname + '/../support/XMLValidator.class');
  } catch (err) {

    // ignore
  }
}