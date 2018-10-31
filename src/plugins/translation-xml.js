const _ = require('lodash');
const { createFilter } = require('rollup-pluginutils');
const parser = require('fast-xml-parser');

const filterText = (text) => {
  if (text) {
    let filtered = text.replace(/&#13;\n/g, ' '); // carriage returns
    filtered = filtered.replace(/&#160;/g, ' '); // spaces
    filtered = filtered.replace(/\{(\s?\d\s?)\}/g, '{{t$1}}'); // {0} => {{t0}}
    return filtered;
  }
  return text;
};

module.exports = (opts = {}) => {
  const include = opts.include || '**/Messages_*.xml';
  const { exclude } = opts;
  const filter = createFilter(include, exclude);
  const filtering = opts.filtering !== false;
  return {
    name: 'translation-xml-import',
    transform(code, id) {
      if (filtering && !filter(id)) return null;
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
        .mapValues(filterText)
        .value();
      return {
        code: `export default ${JSON.stringify(translations)};`,
        map: null,
      };
    },
  };
};
