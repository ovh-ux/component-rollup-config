const _ = require('lodash');
const { createFilter } = require('rollup-pluginutils');
const parser = require('fast-xml-parser');

module.exports = (opts = {}) => {
  const include = opts.include || '**/Messages_*.xml';
  const { exclude } = opts;
  const filter = createFilter(include, exclude);
  return {
    name: 'translation-xml-import',
    transform(code, id) {
      if (!filter(id)) return null;
      let parsed;
      try {
        parsed = parser.parse(code, {
          textNodeName: '#text',
          ignoreAttributes: false,
          parseNodeValue: true,
          parseAttributeValue: true,
        });
      } catch (err) {
        err.message += ` in ${id}`;
        throw err;
      }
      const translations = _.chain(parsed)
        .get('translations.translation')
        .concat()
        .keyBy('@_id')
        .mapValues('#text')
        .value();
      return {
        code: `export default ${JSON.stringify(translations)};`,
        map: null,
      };
    },
  };
};
