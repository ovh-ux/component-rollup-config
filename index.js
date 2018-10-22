const commonjs = require('rollup-plugin-commonjs');
const html = require('rollup-plugin-html');
const babel = require('rollup-plugin-babel');
const name = require('require-package-name');
const postcss = require('rollup-plugin-postcss');
const resolve = require('rollup-plugin-node-resolve');
const path = require('path');
const fs = require('fs');
const translations = require('./plugins/translations');
const uiRouterTranslations = require('./plugins/ui-router-translations');

module.exports = (opts = {}) => {
  const workingDir = process.cwd();
  const packageConfig = JSON.parse(fs.readFileSync(path.resolve(workingDir, 'package.json')));
  const peerDeps = Object.keys(packageConfig.peerDependencies || {});
  let { translationsRoot } = opts;

  const distFileName = opts.dist ? opts.dist.filename : `${name(packageConfig.name) || path.basename(workingDir)}.js`;

  if (!translationsRoot) {
    translationsRoot = fs.existsSync(path.resolve(process.cwd(), 'src'))
      ? path.resolve(process.cwd(), 'src')
      : process.cwd();
  }

  return [{
    input: opts.input,
    external: peerDeps.concat(opts.external || []),
    output: [{
      file: `./dist/${distFileName}`,
      format: 'es',
      sourcemap: true,
    }],
    plugins: [
      html(),
      postcss(),
      resolve(),
      commonjs(),
      translations({ translationsRoot }),
      uiRouterTranslations({ translationsRoot }),
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        plugins: [
          '@babel/plugin-syntax-dynamic-import',
          'babel-plugin-angularjs-annotate',
        ],
      }),
    ],
  }];
};
