const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const slash = require('slash');

const languages = [
  'cs_CZ',
  'de_DE',
  'en_ASIA',
  'en_AU',
  'en_CA',
  'en_GB',
  'en_SG',
  'en_US',
  'es_ES',
  'es_US',
  'fi_FI',
  'fr_CA',
  'fr_FR',
  'it_IT',
  'lt_LT',
  'nl_NL',
  'pl_PL',
  'pt_PT',
];

const normalizePath = p => (_.startsWith(p, '.') ? slash(p) : `./${slash(p)}`);

const injectFallbackFunction = (trads, id, subdirectory, format) => {
  let code = 'switch($translate.fallbackLanguage()) {';
  languages.forEach((lang) => {
    code += `case '${lang}':`;
    trads.forEach((trad) => {
      const dirname = path.dirname(id);
      const fullTradPath = path.resolve(dirname, trad, subdirectory);
      const relativePath = path.relative(dirname, fullTradPath);
      if (fs.existsSync(path.join(fullTradPath, `Messages_${lang}.${format}`))) {
        const toImport = normalizePath(path.join(relativePath, `Messages_${lang}.${format}`));
        code += `promises.push(import('${toImport}').then(module => module.default));`;
      }
    });
    code += 'break;';
  });
  code += '}';
  return code;
};

const injectTranslationSwitch = (trads, id, subdirectory, format) => {
  let code = 'switch($translate.use()) {';
  languages.forEach((lang) => {
    let importFound = 0;
    code += `case '${lang}':`;
    trads.forEach((trad) => {
      const dirname = path.dirname(id);
      const fullTradPath = path.resolve(dirname, trad, subdirectory);
      const relativePath = path.relative(dirname, fullTradPath);
      if (fs.existsSync(path.join(fullTradPath, `Messages_${lang}.${format}`))) {
        const toImport = normalizePath(path.join(relativePath, `Messages_${lang}.${format}`));
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

const injectTranslationImports = (trads, id, subdirectory, format = 'xml') => `
  let promises = [];
  const useFallback = () => {
    ${injectFallbackFunction(trads, id, subdirectory, format)}
  };
  ${injectTranslationSwitch(trads, id, subdirectory, format)}
  promises.forEach(p => asyncLoader.addTranslations(p));
  return $q.all(promises).then(() => $translate.refresh());
`;

module.exports = {
  normalizePath,
  injectTranslationImports,
  languages: _.concat(languages),
};
