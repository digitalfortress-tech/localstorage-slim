const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/ls.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'localstorage-slim.js',
    library: 'ls',
    libraryExport: 'default', // to export only the default fn
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        enforce: 'pre',
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'eslint-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};
