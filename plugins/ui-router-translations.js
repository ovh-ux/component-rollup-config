const { createFilter } = require('rollup-pluginutils');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const glob = require('glob');
const translationTools = require('@ovh-ux/translations-build-tools');
const MagicString = require('magic-string');

const injectImports = (source, resourcePath, options) => {
  const errors = [];
  let result = source;

  // extract translations property from ui-router state declaration
  let translations = _.get(source.match(/translations\s*:\s*\[([^\]]+)\]/), 1);

  if (translations) {
    const relativePath = path.relative(process.cwd(), options.translationsRoot);
    // extract translations paths from array
    translations = translations.split(',').map(x => x.replace(/('|"|\s)/g, '')).filter(x => x);
    // transform each path to relative path
    translations = translations.map(t => `./${path.join(t, 'translations')}`);
    // report a warning for translations path that does not exists
    translations.forEach((t) => {
      if (!fs.existsSync(path.resolve(relativePath, t))) {
        errors.push(new Error(`Missing translations directory: '${t}'`));
      }
    });
    // filter translations that does not exists
    translations = translations.filter(t => fs.existsSync(path.resolve(relativePath, t)));
    translations.forEach((t) => {
      // create translation folder structure in dist file
      mkdirp.sync(path.join(process.cwd(), 'dist', t));
      // export xml translations to js
      glob.sync(path.resolve(relativePath, t, '*.xml')).forEach((translationPath) => {
        const xmldata = fs.readFileSync(translationPath);
        const destFile = path.resolve(process.cwd(), 'dist', t, path.basename(translationPath).replace(/\.xml$/, '.js'));
        fs.writeFileSync(destFile, `export default ${translationTools.translations(xmldata)}`);
      });
    });
  }

  if (_.get(translations, 'length') > 0) {
    // craft js resolve code to load translations dynamically
    let jsCode = 'translations($q, $translate, asyncLoader) { const imports = [';
    translations.forEach((translation) => {
      jsCode += ` import(\`${translation}/Messages_\${$translate.use()}.js\`)
                    .catch(() => import(\`${translation}/Messages_\${$translate.fallbackLanguage()}.js\`))
                    .then(i => i.default),
                `;
    });
    jsCode += ']; imports.forEach(p => asyncLoader.addTranslations(p)); return $q.all(imports).then(() => $translate.refresh()); }';

    // if a resolve already exists, prepend the code to inject
    if (/resolve\s*:\s*{/.test(result)) {
      result = result.replace(/resolve\s*:\s*{/, `resolve: {\n${jsCode},`);
    // otherwise add a resolve function along with the code to inject
    } else {
      const beforeReplace = result;
      result = result.replace(/(translations\s*:\s*\[[^\]]+\]\s*,)/, `$1 \nresolve: {\n${jsCode}},`);
      if (result === beforeReplace) {
        // handle the case of missing comma at the end of translations declaration
        result = result.replace(/(translations\s*:\s*\[[^\]]+\]\s*)/, `$1, \nresolve: {\n${jsCode}},`);
      }
    }
  }

  return { result, errors };
};

const uiRouterTranslations = (source, opts, resourcePath, errorHandler) => {
  const parts = source.split(/\.state\s*\(/);
  let modifiedSource = source;

  _.filter(parts, _.identity).forEach((part) => {
    const { result, errors } = injectImports(part, resourcePath, opts);
    if (errorHandler) {
      errors.forEach(errorHandler);
    }
    if (result !== part) {
      modifiedSource = modifiedSource.replace(part, result);
    }
  });

  return modifiedSource;
};

module.exports = (opts = {}) => {
  const options = opts;
  if (!options.include) {
    options.include = '**/*.js';
  }
  const filter = createFilter(options.include, options.exclude);
  return {
    name: 'ui-router-translations',
    transform(code, id) {
      if (filter(id)) {
        const ms = new MagicString(uiRouterTranslations(code, options, id, this.error));
        return {
          code: ms.toString(),
          map: ms.generateMap(),
        };
      }
      return undefined;
    },
  };
};
