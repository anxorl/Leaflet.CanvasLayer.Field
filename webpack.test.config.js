var path = require("path")
var webpack = require("webpack")
var WebpackBuildNotifierPlugin = require("webpack-build-notifier")
const ExtractTextPlugin = require("extract-text-webpack-plugin")

const PATHS = {
  src: path.join(__dirname, './src'),
  dist: path.join(__dirname, './test/dist')
}

module.exports = {

  entry: {
    "leaflet-canvas-grid": PATHS.src + '/LeafletCanvasGrid.ts',
  },
  output: {
    path: PATHS.dist,
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  devtool: "source-map",
  module: {
    rules: [{
        test: /\.ts$/,
        use: 'tslint-loader',
        enforce: 'pre'
      },
      {
        test: /\.ts$/,
        use: 'awesome-typescript-loader'
      }
    ]
  },

  resolve: {
    // you can now require('file') instead of require('file.js')
    extensions: ['.ts', '.js']
  },
  plugins: [
    /* new WebpackBuildNotifierPlugin({
      title: "Construcción visorMallas"
    }), */
    /* new webpack.optimize.UglifyJsPlugin({
      mangle: {
        keep_fnames: true
      },
      output: {
        comments: false
      }
    }) */
  ],
  watchOptions: {
    ignored: '/node_modules/',
    poll: 2000
  }
}