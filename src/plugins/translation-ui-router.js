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
  return {
    name: 'translation-ui-router',
    transform(code, id) {
      if (!filter(id)) return null;
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
            const trads = _.chain(props)
              .filter({ key: { name: 'translations' } })
              .filter({ type: 'Property' })
              .head();

            if (trads.value()) {
              const resolve = _.chain(props)
                .filter({ key: { name: 'resolve' } })
                .filter({ type: 'Property' })
                .head()
                .get('value')
                .get('properties')
                .last()
                .value();
              let inject = utils.injectTranslationImports(trads.get('value.elements').map('value').value(), id, subdirectory);
              inject = `translations: ($q, $translate, asyncLoader) => { ${inject} }`;
              removeProperty(code, magicString, trads.value().start, trads.value().end);
              if (resolve) {
                magicString.appendRight(resolve.end, `,${inject}`);
              } else {
                const firstProp = _.chain(node).get('arguments').get(1).get('properties')
                  .first()
                  .value();
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
