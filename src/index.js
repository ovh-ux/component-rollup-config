const commonjs = require('rollup-plugin-commonjs');
const html = require('rollup-plugin-html');
const babel = require('rollup-plugin-babel');
const postcss = require('rollup-plugin-postcss');
const resolve = require('rollup-plugin-node-resolve');
const path = require('path');
const fs = require('fs');
const translationInject = require('./plugins/translation-inject');
const translationUiRouter = require('./plugins/translation-ui-router');
const translationXML = require('./plugins/translation-xml');

module.exports = (opts = {}) => {
  const workingDir = process.cwd();
  const packageConfig = JSON.parse(fs.readFileSync(path.resolve(workingDir, 'package.json')));
  const peerDeps = Object.keys(packageConfig.peerDependencies || {});
  return [{
    experimentalCodeSplitting: true,
    input: opts.input,
    external: peerDeps.concat(opts.external || []),
    output: [{
      format: 'es',
      sourcemap: true,
      dir: './dist',
    }],
    plugins: [
      html(),
      postcss(),
      resolve(),
      commonjs(),
      translationInject(),
      translationUiRouter({
        subdirectory: 'translations',
      }),
      translationXML(),
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
