var path = require("path")
var webpack = require("webpack")
var WebpackBuildNotifierPlugin = require("webpack-build-notifier")
const ExtractTextPlugin = require("extract-text-webpack-plugin")

const PATHS = {
  src: path.join(__dirname, './src'),
  dist: path.join(__dirname, './dist')
}

module.exports = {

  entry: {
    "leaflet-canvas-grid": PATHS.src + '/LeafletCanvasGrid.ts',
  },
  mode: 'development',
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

  externals: {
    'chroma-js': 'chroma-js',
    'd3-array': 'd3-array',
    'd3-scale': 'd3-scale',
    'd3-selection': 'd3-selection',
    'd3-timer': 'd3-timer',
    'geotiff': 'geotiff',
    'leaflet': 'leaflet',
    'leaflet-canvas-layer': 'leaflet-canvas-layer',
    '../../node_modules/leaflet/dist/leaflet.css': 'leaflet/dist/leaflet.css',
    'proj4': 'proj4'
  },

  resolve: {
    // you can now require('file') instead of require('file.js')
    extensions: ['.ts', '.js']
  },
  plugins: [
    /* new WebpackBuildNotifierPlugin({
      title: "Construcción visorMallas"
    }), */
    /*new webpack.optimize.UglifyJsPlugin({
      mangle: {
        keep_fnames: true
      },
      output: {
        comments: false
      }
    })*/
  ],
  watchOptions: {
    ignored: '/node_modules/',
    poll: 2000
  }
}