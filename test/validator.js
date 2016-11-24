var validator = require('../lib/validator');

var fs = require('fs');

var BPMN_SCHEMA = 'test/xsd/BPMN20.xsd';
var UMLAUT_SCHEMA = 'test/xsd/UmlautSchema.xsd';

var BPMN_FILE = 'test/diagram.bpmn';
var INVALID_BPMN_FILE = 'test/invalid.bpmn';


describe('validator', function() {

  describe('should validate xml string', function() {

    it('correct', function(done) {

      var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
                '</bpmn2:definitions>';

      validator.validateXML(xml, BPMN_SCHEMA, function(err, result) {
        if (err) {
          done(err);
        } else {
          expect(result.valid).toBe(true);
          done();
        }
      });
    });


    it('broken', function(done) {

      var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<bpmn2:definitions unknownAttr="BOOO" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
                '</bpmn2:definitions>';

      validator.validateXML(xml, BPMN_SCHEMA, function(err, result) {
        expect(err).toBeDefined();

        // correct error message
        expect(err.message).toMatch(/Attribute 'unknownAttr' is not allowed to appear in element 'bpmn2:definitions'/);

        // and line number
        expect(err.message).toMatch(/\(1:476\)/);

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
          expect(result.valid).toBe(true);
          done();
        }
      });
    });


    it('with umlaut', function(done) {

      var xml = (
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Test>ü</Test>'
      );

      validator.validateXML(xml, UMLAUT_SCHEMA, function(err, result) {
        expect(result.valid).toBe(true);
        done();
      });
    });

  });


  describe('should validate XML stream', function() {

    it('correct', function(done) {

      var xmlStream = fs.createReadStream(BPMN_FILE, { encoding: 'UTF-8' });

      validator.validateXML(xmlStream, BPMN_SCHEMA, function(err, result) {

        if (err) {
          done(err);
        } else {
          expect(result.valid).toBe(true);
          done();
        }
      });
    });


    it('broken', function(done) {

      var xmlStream = fs.createReadStream(INVALID_BPMN_FILE, { encoding: 'UTF-8' });

      validator.validateXML(xmlStream, BPMN_SCHEMA, function(err, result) {
        expect(err).toBeDefined();
        done();
      });
    });

  });


  describe('should validate { file }', function() {

    it('correct', function(done) {

      validator.validateXML({ file: BPMN_FILE }, BPMN_SCHEMA, function(err, result) {

        if (err) {
          done(err);
        } else {
          expect(result.valid).toBe(true);
          done();
        }
      });
    });


    it('broken', function(done) {

      validator.validateXML({ file: INVALID_BPMN_FILE }, BPMN_SCHEMA, function(err, result) {
        expect(err).toBeDefined();
        done();
      });
    });

  });

});
