const _ = require('lodash');
const { createFilter } = require('rollup-pluginutils');
const parser = require('xml2json');

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
        parsed = JSON.parse(parser.toJson(code));
      } catch (err) {
        err.message += ` in ${id}`;
        throw err;
      }
      const translations = _.chain(parsed)
        .get('translations.translation')
        .concat()
        .keyBy('id')
        .mapValues('$t')
        .value();
      return {
        code: `export default ${JSON.stringify(translations)};`,
        map: null,
      };
    },
  };
};
