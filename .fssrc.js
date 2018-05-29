// vim: set ft=javascript fdm=marker et ff=unix tw=80 sw=2:

const path = require('path')
const { version, name, author, dependencies } = require('./package.json')

const banner =
  '/*!\n' +
  ' * ' + name + ' v' + version + '\n' +
  ' *\n' +
  ' * @author ' + author + '.\n' +
  ' * Released under the MIT License.\n' +
  ' */\n'

const babelConfig = {
  presets: [
    ['@babel/preset-env', {
      'loose': true,
      'modules': false,
      'useBuiltIns': false,
      'targets': {
        browsers: [ 'last 2 versions', 'not ie <= 8' ]
      }
    }]
  ],
  plugins: [
    '@babel/plugin-external-helpers',
    'transform-decorators-legacy',
    [ '@babel/plugin-transform-runtime', {
      'helpers': false,
      'polyfill': false,
      'regenerator': true,
      'moduleName': '@babel/runtime'
    } ]
  ],
  externalHelpers: true,
  runtimeHelpers: true,
  babelrc: false,
  comments: false
}

module.exports = {
  rollup: {
    destDir: path.join(__dirname, './lib'),
    dependencies: dependencies,
    plugins: {
      babel: (rollupCfg) => {
        const babelrc = Object.assign({}, babelConfig)
        if ([ 'es', 'cjs' ].includes(rollupCfg.output.format)) {
          babelrc.comments = true
        }
        return babelrc
      }
    },
    entry: [ {
      input: 'src/index.js',
      targets: [
        {
          format: 'umd',
          name: 'timing',
          file: 'timing.js',
          banner
        },
        {
          format: 'cjs',
          file: 'timing.esm.js'
        }
      ]
    } ]
  }
}
