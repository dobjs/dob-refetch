var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname,
  debug: true,
  devtool: '#inline-source-map',
  entry: {
    RealWorld: path.join(__dirname + '/RealWorld/index.tsx'),
    TodoList: path.join(__dirname + '/TodoList/index.tsx'),
  },
  output: {
    path: __dirname,
    filename: '[name]/build.js',
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  resolve: {
    alias: {},
    extensions: ['', '.tsx', '.ts', '.js', '.jsx'],
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
