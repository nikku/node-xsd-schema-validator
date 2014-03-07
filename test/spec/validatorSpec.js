var validator = require('../../lib/validator');
var fs = require('fs');

var SAMPLE_SCHEMA = 'test/fixtures/xsd/BPMN20.xsd';

describe('validator', function() {

  it('should validate correct xml', function(done) {

    var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
              '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
              '</bpmn2:definitions>';

    validator.validateXML(xml, SAMPLE_SCHEMA, function(err, result) {
      if (err) {
        done(err);
      } else {
        expect(result.valid).toBe(true);
        done();
      }
    });
  });

  it('should validate incorrect xml', function(done) {

    var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
              '<bpmn2:definitions unknownAttr="BOOO" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="simple" targetNamespace="http://activiti.org/bpmn">' +
              '</bpmn2:definitions>';

    validator.validateXML(xml, SAMPLE_SCHEMA, function(err, result) {
      expect(err).toBeDefined();
      done();
    });
  });
});