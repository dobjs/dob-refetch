var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname,
  debug: true,
  devtool: '#inline-source-map',
  entry: {
    RealWorld: path.join(__dirname + '/RealWorld/index.tsx'),
  },
  output: {
    path: __dirname,
    filename: '[name]/build.js',
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  resolve: {
    alias: {
      'refect-next': path.join(__dirname, '..', 'src/'),
    },
    extensions: ['', '.js'],
  },

  stats: {
    colors: true,
    chunks: false,
  },

  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        include: [__dirname, path.join(__dirname, '..', 'index.ts')],
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css', 'sass'],
        include: [__dirname, path.join(__dirname, '..', 'node_modules')],
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader'],
        include: [__dirname, path.join(__dirname, '..', 'node_modules')],
      },
    ],
  },
};
