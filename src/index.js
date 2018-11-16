const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const html = require('rollup-plugin-html');
const less = require('rollup-plugin-less');
const lessPluginRemcalc = require('less-plugin-remcalc');
const path = require('path');
const peerdeps = require('rollup-plugin-peer-deps-external');
const resolve = require('rollup-plugin-node-resolve');
const sass = require('rollup-plugin-sass');
const translationInject = require('./plugins/translation-inject');
const translationUiRouter = require('./plugins/translation-ui-router');
const translationXML = require('./plugins/translation-xml');

const generateConfig = opts => Object.assign({
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
      presets: [
        ['@babel/preset-env'],
      ],
    }),
  ],
}, opts);

const cjs = opts => generateConfig(Object.assign({
  experimentalCodeSplitting: true,
  output: [{
    dir: './dist/cjs',
    format: 'cjs',
    sourcemap: true,
  }],
}, opts));

const umd = (opts, name, globals = {}) => generateConfig(Object.assign({
  output: [{
    name,
    file: `./dist/umd/${name}.js`,
    format: 'umd',
    globals,
    sourcemap: true,
  }],
}, opts));

const config = (opts = {}) => [
  cjs(opts),
  umd(opts, path.basename(process.cwd())),
];

config.cjs = cjs;
config.umd = umd;
config.plugins = {
  translationInject,
  translationUiRouter,
  translationXML,
  cjs,
  umd,
};

module.exports = config;
