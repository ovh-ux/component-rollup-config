const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const html = require('rollup-plugin-html');
const less = require('rollup-plugin-less');
const lessPluginRemcalc = require('less-plugin-remcalc');
const peerdeps = require('rollup-plugin-peer-deps-external');
const resolve = require('rollup-plugin-node-resolve');
const sass = require('rollup-plugin-sass');
const translationInject = require('./plugins/translation-inject');
const translationUiRouter = require('./plugins/translation-ui-router');
const translationXML = require('./plugins/translation-xml');

const config = (opts = {}) => [{
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
    less({
      insert: true,
      // prevent generating a `rollup.build.css` file due to `insert: true` option.
      output: css => css,
      option: {
        plugins: [
          lessPluginRemcalc,
        ],
      },
    }),
    sass({
      insert: true,
      output: false,
    }),
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

config.plugins = {
  translationInject,
  translationUiRouter,
  translationXML,
};

module.exports = config;
