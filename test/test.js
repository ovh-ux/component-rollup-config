const _ = require('lodash');
const assert = require('assert');
const rollup = require('rollup');
const hypothetical = require('rollup-plugin-hypothetical');
const translationXML = require('../src/plugins/translation-xml');

describe('plugins', () => {
  const sample = {};

  describe('translation-xml', () => {
    before(() => rollup.rollup({
      input: './trad.xml',
      plugins: [
        hypothetical({
          files: {
            './trad.xml': '<translations>'
                        + '<translation id="foo" qtlid="1">Foo</translation>'
                        + '<translation id="bar" qtlid="2">Bar</translation>'
                        + '<translation>Missing id</translation>'
                        + '<translation id="missingContent"></translation>'
                        + '</translations>',
          },
        }),
        translationXML({
          include: '*.xml',
        }),
      ],
    }).then((bundle) => {
      sample.modules = bundle.modules;
    }));

    it('should convert XML to JSON', () => {
      const code = _.chain(sample)
        .get('modules')
        .head()
        .get('code')
        .value();
      console.log(code);
      assert(code === 'export default {"foo":"Foo","bar":"Bar"};');
    });
  });
});
