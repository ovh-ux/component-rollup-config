const { merge } = require('lodash');
const babel = require('rollup-plugin-babel');
const camelcase = require('camelcase');
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

const cjs = opts => generateConfig(merge({
  experimentalCodeSplitting: true,
  output: {
    dir: './dist/cjs',
    format: 'cjs',
    sourcemap: true,
  },
}, opts));

const umd = (opts) => {
  const defaultName = path.basename(process.cwd());
  return generateConfig(merge({
    output: {
      name: defaultName,
      file: `./dist/umd/${defaultName}.js`,
      format: 'umd',
      sourcemap: true,
    },
  }, opts));
};

const es = opts => generateConfig(merge({
  experimentalCodeSplitting: true,
  output: {
    dir: './dist/esm',
    format: 'es',
    sourcemap: true,
  },
}, opts));

const iife = (opts) => {
  const defaultName = path.basename(process.cwd());
  return generateConfig(merge({
    output: {
      name: camelcase(defaultName),
      file: `./dist/iife/${defaultName}.js`,
      format: 'iife',
      sourcemap: true,
    },
  }, opts));
};

const config = (globalOpts = {}) => ({
  cjs: (opts = {}) => cjs(merge(opts, globalOpts)),
  es: (opts = {}) => es(merge(opts, globalOpts)),
  iife: (opts = {}) => iife(merge(opts, globalOpts)),
  umd: (opts = {}) => umd(merge(opts, globalOpts)),
});

config.plugins = {
  translationInject,
  translationUiRouter,
  translationXML,
};

module.exports = config;
