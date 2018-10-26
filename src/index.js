const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const html = require('rollup-plugin-html');
const peerdeps = require('rollup-plugin-peer-deps-external');
const postcss = require('rollup-plugin-postcss');
const resolve = require('rollup-plugin-node-resolve');
const translationInject = require('./plugins/translation-inject');
const translationUiRouter = require('./plugins/translation-ui-router');
const translationXML = require('./plugins/translation-xml');

module.exports = (opts = {}) => [{
  experimentalCodeSplitting: true,
  input: opts.input,
  output: [{
    format: 'es',
    sourcemap: true,
    dir: './dist',
  }],
  plugins: [
    peerdeps(),
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
