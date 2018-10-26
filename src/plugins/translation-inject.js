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
          const match = text.match(/@ngTranslationsInject(.*)/);
          if (match) {
            const trads = _.chain(match)
              .get(1)
              .split(/\s+/)
              .filter(t => t && !/@ngTranslations?Inject/i.test(t))
              .value();
            if (trads && trads.length) {
              const inject = utils.injectTranslationImports(trads, id, subdirectory);
              magicString.overwrite(start, end, `/* @ngInject */ ($translate, $q, asyncLoader) => { ${inject} }`);
            } else {
              magicString.overwrite(start, end, 'angular.noop');
            }
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
