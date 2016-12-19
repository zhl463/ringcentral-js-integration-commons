import path from 'path';

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
};

const index = {
  ...base,
  entry: [
    path.resolve(__dirname, 'index.js'),
  ],
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'index.js',
    publicPath: '/build',
  },
};


export default index;
