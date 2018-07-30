const webpack = require('webpack');
const path = require('path');
module.exports = {

//  mode: 'production',
  mode: 'development',
  devtool: 'source-map',
  node: {
    fs: 'empty'
  },
  entry: {
    lumavatejs_vendor: path.resolve(__dirname, 'src', 'vendor', 'vendor.js'),// + '/vendor.js',
    lumavatejs: path.resolve(__dirname, 'src', 'lumavate.js')// + '/lumavate.js',
  },
  watch: false,
  watchOptions: {
    aggregateTimeout: 300,
    ignored: /node_modules/,
    poll: 1000
  },
  externals: {
//    webArTracking: 'WebArTracking'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  optimization: {
        splitChunks: {
            cacheGroups: {
               vendor: {
                chunks: 'initial',
                name: 'vendor',
                test: 'vendor',
                enforce: true
              },
            }
        },
    },
  resolve: {
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.css$/,
          use: {
            loader: 'css-loader',
            options: { minimize: true }
          }
      },
    ],
  },
}
