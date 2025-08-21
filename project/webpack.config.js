const path = require('path');

module.exports = {
  entry: './src/renderer/index.jsx',
  target: 'electron-renderer',
  // Fixes the Content Security Policy (CSP) error
  devtool: 'cheap-module-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};