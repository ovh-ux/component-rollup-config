const _ = require('lodash');
const { createFilter } = require('rollup-pluginutils');
const { walk } = require('estree-walker');
const MagicString = require('magic-string');
const utils = require('./translation-utils');

const removeProperty = (code, magicString, start, end) => {
  magicString.remove(start, end);
  for (let i = end; i < code.length - 1; i += 1) {
    const ch = code[i];
    if (ch === ',') {
      magicString.remove(i, i + 1);
      break;
    } else if (/\w|}/.test(ch)) {
      break;
    }
  }
};

module.exports = (opts = {}) => {
  const include = opts.include || '**/*.js';
  const { exclude } = opts;
  const filter = createFilter(include, exclude);
  const sourcemap = opts.sourcemap !== false;
  const subdirectory = opts.subdirectory || './';
  const filtering = opts.filtering !== false;
  return {
    name: 'translation-ui-router',
    transform(code, id) {
      if (filtering && !filter(id)) return null;
      const ast = this.parse(code);
      const magicString = new MagicString(code);
      walk(ast, {
        enter(node) {
          if (sourcemap) {
            magicString.addSourcemapLocation(node.start);
            magicString.addSourcemapLocation(node.end);
          }
          if (_.get(node, 'callee.object.name') === '$stateProvider') {
            const props = _.chain(node)
              .get('arguments')
              .last()
              .get('properties')
              .value();
            const translations = _.chain(props)
              .filter({ key: { name: 'translations' }, type: 'Property' })
              .head();

            if (translations.value()) {
              const resolve = _.chain(props)
                .filter({ key: { name: 'resolve' }, type: 'Property' })
                .head()
                .get('value.properties')
                .last()
                .value();
              let inject = utils.injectTranslationImports(
                translations
                  .get('value.elements')
                  .map('value')
                  .value(),
                id,
                subdirectory,
              );

              inject = `translations: ($q, $translate, asyncLoader) => { ${inject} }`;

              removeProperty(code, magicString,
                translations.value().start, translations.value().end);

              if (resolve) {
                magicString.appendRight(resolve.end, `,${inject}`);
              } else {
                const firstProp = _(node).get('arguments[1].properties[0]');
                inject = `resolve: { ${inject} },`;
                magicString.appendLeft(firstProp.start, inject);
              }
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
