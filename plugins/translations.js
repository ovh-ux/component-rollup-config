const { createFilter } = require('rollup-pluginutils');
const { translations } = require('@ovh-ux/translations-build-tools');
const MagicString = require('magic-string');

module.exports = (opts = {}) => {
  const options = opts;
  if (!options.include) {
    options.include = '**/*.xml';
  }
  const filter = createFilter(options.include, options.exclude);
  return {
    transform(code, id) {
      if (filter(id)) {
        const ms = new MagicString(`export default ${translations(code)}`);
        return {
          code: ms.toString(),
          map: ms.generateMap(),
        };
      }
      return undefined;
    },
  };
};
