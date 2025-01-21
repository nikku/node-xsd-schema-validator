import bpmnIoPlugin from 'eslint-plugin-bpmn-io';

const files = {
  test: [
    'test/**/*.js'
  ]
};

export default [

  // all files
  ...bpmnIoPlugin.configs.node,

  // test
  ...bpmnIoPlugin.configs.mocha.map(config => {

    return {
      ...config,
      files: files.test
    };
  })
];
