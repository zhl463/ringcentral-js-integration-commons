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
      {
        test: /\.ogg$/,
        loader: 'url?publicPath=./&name=audio/[name]_[hash].[ext]',
      },
    ],
  },
};

const index = {
  ...base,
  entry: {
    index: [
      path.resolve(__dirname, 'index'),
    ],
    proxy: [
      path.resolve(__dirname, './proxy'),
    ],
    redirect: [
      path.resolve(__dirname, './redirect'),
    ],
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: '[name].js',
    publicPath: '/build',
  },
};


export default index;
