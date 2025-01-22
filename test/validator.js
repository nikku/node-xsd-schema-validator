const validator = require('..');

const { expect } = require('chai');

const { createReadStream } = require('node:fs');

const BPMN_SCHEMA = 'test/xsd/bpmn/BPMN20.xsd';
const UMLAUT_SCHEMA = 'test/xsd/Umlauts.xsd';
const INCLUDE_SCHEMA = 'test/xsd/Include.xsd';
const IMPORT_SCHEMA = 'test/xsd/Import.xsd';
const OTHER_SCHEMA = 'test/xsd/Other.xsd';

const BPMN_FILE = 'test/diagram.bpmn';
const INVALID_BPMN_FILE = 'test/invalid.bpmn';


describe('validator', function() {

  describe('#setup', function() {

    this.timeout(30000);

    beforeEach(cleanup);


    it('should pre-compile', function() {
      return validator.setup();
    });


    it('should compile on the fly (without prior setup)', async function() {

      // given
      const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
                '</bpmn2:definitions>';

      // when
      const { valid } = await validator.validateXML(xml, BPMN_SCHEMA);

      // then
      expect(valid).to.be.true;
    });

  });


  describe('should validate xml string', function() {

    it('valid', async function() {

      // given
      const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
                '</bpmn2:definitions>';

      // when
      const { valid } = await validator.validateXML(xml, BPMN_SCHEMA);

      // then
      expect(valid).to.be.true;
    });


    it('invalid', async function() {

      // given
      const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<bpmn2:definitions unknownAttr="BOOO" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
                '</bpmn2:definitions>';

      let err;

      // when
      try {
        await validator.validateXML(xml, BPMN_SCHEMA);
      } catch (_err) {
        err = _err;
      }

      // then
      expect(err).to.exist;

      // correct error message
      expect(err.message).match(/Attribute 'unknownAttr' is not allowed to appear in element 'bpmn2:definitions'/);

      // and line number
      expect(err.message).match(/\(1:476\)/);
    });


    it('with international characters', async function() {

      // given
      const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" name="Obračun potnih stroškov" targetNamespace="http://activiti.org/bpmn">' +
                '</bpmn2:definitions>';

      // when
      const { valid } = await validator.validateXML(xml, BPMN_SCHEMA);

      // then
      expect(valid).to.be.true;
    });


    describe('with umlaut', function() {

      it('valid', async function() {

        // given
        const xml = (
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Test xmlns="http://umlauts">ü</Test>'
        );

        // when
        const { valid } = await validator.validateXML(xml, UMLAUT_SCHEMA);

        // then
        expect(valid).to.be.true;
      });


      it('invalid', async function() {

        // given
        const xml = (
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<AÖ xmlns="http://umlauts"></AÖ>'
        );

        let err;

        // when
        try {
          await validator.validateXML(xml, UMLAUT_SCHEMA);
        } catch (_err) {
          err = _err;
        }

        // then
        expect(err).to.exist;
        expect(err.valid).to.be.false;
      });

    });

  });


  describe('should validate XML stream', function() {

    it('valid', async function() {

      // given
      const xmlStream = createReadStream(BPMN_FILE, { encoding: 'utf8' });

      // when
      const { valid } = await validator.validateXML(xmlStream, BPMN_SCHEMA);

      // then
      expect(valid).to.be.true;
    });


    it('invalid', async function() {

      // given
      const xmlStream = createReadStream(INVALID_BPMN_FILE, { encoding: 'utf8' });

      let err;

      // when
      try {
        await validator.validateXML(xmlStream, BPMN_SCHEMA);
      } catch (_err) {
        err = _err;
      }

      // then
      expect(err).to.exist;
    });

  });


  describe('should validate Buffer', function() {

    it('valid', async function() {

      // given
      const buffer = createBuffer(
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
        '</bpmn2:definitions>'
      );

      // when
      const { valid } = await validator.validateXML(buffer, BPMN_SCHEMA);

      // then
      expect(valid).to.be.true;
    });


    it('invalid', async function() {

      // given
      const buffer = createBuffer(
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn2:definitions unknownAttr="BOOO" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
        '</bpmn2:definitions>'
      );

      let err;

      // when
      try {
        await validator.validateXML(buffer, BPMN_SCHEMA);
      } catch (_err) {
        err = _err;
      }

      // then
      expect(err).to.exist;
    });

  });


  describe('should validate { file }', function() {

    describe('bpmn', function() {

      it('valid', async function() {

        // when
        const { valid } = await validator.validateXML({ file: BPMN_FILE }, BPMN_SCHEMA);

        // then
        expect(valid).to.be.true;
      });


      it('invalid', async function() {

        // given
        let err;

        // when
        try {
          await validator.validateXML({ file: INVALID_BPMN_FILE }, BPMN_SCHEMA);
        } catch (_err) {
          err = _err;
        }

        // then
        expect(err).to.exist;
      });

    });


    describe('with include', function() {

      it('valid', async function() {

        // when
        const { valid } = await validator.validateXML({ file: 'test/umlauts.xml' }, INCLUDE_SCHEMA);

        // then
        expect(valid).to.be.true;
      });


      it('invalid', async function() {

        // given
        let err;

        // when
        try {
          await validator.validateXML({ file: 'test/umlauts-invalid.xml' }, INCLUDE_SCHEMA);
        } catch (_err) {
          err = _err;
        }

        // then
        expect(err).to.exist;
      });

    });


    describe('with import', function() {

      it('valid', async function() {

        // when
        const { valid } = await validator.validateXML({ file: 'test/umlauts.xml' }, IMPORT_SCHEMA);

        // then
        expect(valid).to.be.true;
      });


      it('invalid', async function() {

        // given
        let err;

        try {
          await validator.validateXML({ file: 'test/umlauts-invalid.xml' }, IMPORT_SCHEMA);
        } catch (_err) {
          err = _err;
        }

        // then
        expect(err).to.exist;
      });

    });


    describe('with xi:include', function() {

      it('valid', async function() {

        // when
        const { valid } = await validator.validateXML({ file: 'test/xi-include.xml' }, OTHER_SCHEMA);

        // then
        expect(valid).to.be.true;
      });


      // TODO(nikku): not supported during validation,
      // cf. https://github.com/nikku/node-xsd-schema-validator/issues/10
      it.skip('invalid', async function() {

        // given
        let err;

        try {
          await validator.validateXML({ file: 'test/xi-include-invalid.xml' }, OTHER_SCHEMA);
        } catch (_err) {
          err = _err;
        }

        // then
        expect(err).to.exist;
      });

    });

  });


  describe('should not validate unsupported type for xml', function() {

    it('valid', async function() {

      // given
      let err;

      try {

        // @ts-expect-error
        await validator.validateXML([ 'this is not valid' ], BPMN_SCHEMA);
      } catch (_err) {
        err = _err;
      }

      // then
      expect(err).to.exist;
    });

  });


  describe('should handle missing Java', function() {

    let JAVA_HOME;

    beforeEach(function() {
      JAVA_HOME = process.env.JAVA_HOME;
    });

    afterEach(function() {
      process.env.JAVA_HOME = JAVA_HOME;
    });

    const validXML = (
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
      '</bpmn2:definitions>'
    );


    it('Java JRE (validation)', async function() {

      // given
      process.env.JAVA_HOME = '/no-where';

      let err;

      // when
      try {
        await validator.validateXML(validXML, BPMN_SCHEMA);
      } catch (_err) {
        err = _err;
      }

      // then
      expect(err).to.exist;
    });


    it('Java JDK (compilation)', async function() {

      // given
      process.env.JAVA_HOME = '/no-where';

      // and no pre-compiled binary exists
      cleanup();

      let err;

      // when
      try {
        await validator.validateXML(validXML, BPMN_SCHEMA);
      } catch (_err) {
        err = _err;
      }

      // then
      expect(err).to.exist;
    });

  });


  describe('should validate example schemata', function() {

    const MDFE_SCHEMA = 'test/xsd/mdfe/mdfe_v3.00.xsd';
    const VALID_MDFE_FILE = 'test/mdfe.xml';
    const INVALID_MDFE_FILE = 'test/mdfe-invalid.xml';


    describe('MDFE (recursively expanding schema) in insecure mode', function() {

      it('valid', async function() {

        // when
        const { valid } = await validator.validateXML({ file: VALID_MDFE_FILE }, MDFE_SCHEMA, { insecure: true });

        // then
        expect(valid).to.be.true;
      });


      it('invalid', async function() {

        let err;

        // when
        try {
          await validator.validateXML({ file: INVALID_MDFE_FILE }, MDFE_SCHEMA, { insecure: true });
        } catch (_err) {
          err = _err;
        }

        // then
        expect(err).to.exist;
        expect(err.valid).to.be.false;
        expect(err.result).to.eql('WITH_ERRORS');
      });

    });

  });

});


// helpers ///////////////

function createBuffer(str) {
  return Buffer.from(str);
}

function cleanup() {
  try {
    require('fs').unlinkSync(__dirname + '/../support/XMLValidator.class');
  } catch (err) {

    // ignore
  }
}