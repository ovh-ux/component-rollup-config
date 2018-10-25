const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const languages = ['fr_FR', 'en_GB'];
const normalizePath = p => (_.startsWith(p, '.') ? p : `./${p}`);

const injectFallbackFunction = (trads, id, subdirectory) => {
  let code = 'switch($translate.fallbackLanguage()) {';
  languages.forEach((lang) => {
    code += `case '${lang}':`;
    trads.forEach((trad) => {
      const fullTradPath = path.resolve(path.dirname(id), trad, subdirectory);
      const relativePath = path.relative(path.dirname(id), fullTradPath);
      if (fs.existsSync(path.join(fullTradPath, `Messages_${lang}.xml`))) {
        const toImport = normalizePath(path.join(relativePath, `Messages_${lang}.xml`));
        code += `promises.push(import('${toImport}').then(module => module.default));`;
      }
    });
    code += 'break;';
  });
  code += '}';
  return code;
};

const injectTranslationSwitch = (trads, id, subdirectory) => {
  let code = 'switch($translate.use()) {';
  languages.forEach((lang) => {
    let importFound = 0;
    code += `case '${lang}':`;
    trads.forEach((trad) => {
      const fullTradPath = path.resolve(path.dirname(id), trad, subdirectory);
      const relativePath = path.relative(path.dirname(id), fullTradPath);
      if (fs.existsSync(path.join(fullTradPath, `Messages_${lang}.xml`))) {
        const toImport = normalizePath(path.join(relativePath, `Messages_${lang}.xml`));
        code += `promises.push(import('${toImport}').then(module => module.default));`;
        importFound += 1;
      }
    });
    if (!importFound) {
      code += 'useFallback();';
    }
    code += 'break;';
  });
  code += 'default: useFallback(); break; }';
  return code;
};

const injectTranslationImports = (trads, id, subdirectory) => {
  let code = 'let promises = [];';
  code += 'const useFallback = () => {';
  code += injectFallbackFunction(trads, id, subdirectory);
  code += '};';
  code += injectTranslationSwitch(trads, id, subdirectory);
  code += 'promises.forEach(p => asyncLoader.addTranslations(p));';
  code += 'return $q.all(promises).then(() => $translate.refresh());';
  return code;
};

module.exports = {
  normalizePath,
  injectTranslationImports,
};
