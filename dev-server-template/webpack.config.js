import path from 'path';
import webpack from 'webpack';

const base = {
  devtool: 'inline-source-map',
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: /node_modules/,
      },
      {
        test: /\.json$/i,
        loader: 'json',
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
};

const index = {
  ...base,
  entry: [
    'webpack/hot/only-dev-server',
    path.resolve(__dirname, 'index.js'),
  ],
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'index.js',
    publicPath: '/build',
  },
};


export default index;
