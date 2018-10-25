const _ = require('lodash');
const { createFilter } = require('rollup-pluginutils');
const MagicString = require('magic-string');
const utils = require('./translation-utils');

module.exports = (opts = {}) => {
  const include = opts.include || '**/*.js';
  const { exclude } = opts;
  const filter = createFilter(include, exclude);
  const sourcemap = opts.sourcemap !== false;
  const subdirectory = opts.subdirectory || './';
  return {
    name: 'translation-ui-router',
    transform(code, id) {
      if (!filter(id)) return null;
      const magicString = new MagicString(code);
      this.parse(code, {
        onComment: (block, text, start, end) => {
          if (/@ovhTranslationsInject/.test(text)) {
            const trads = _.chain(text).split(/\s+/).filter(t => t && !/@ovhTranslationsInject/.test(t)).value();
            const inject = utils.injectTranslationImports(trads, id, subdirectory);
            magicString.overwrite(start, end, `($translate, $q, asyncLoader) => { ${inject} }`);
          }
        },
      });
      return {
        code: magicString.toString(),
        map: sourcemap ? magicString.generateMap({ hires: true }) : null,
      };
    },
  };
};
