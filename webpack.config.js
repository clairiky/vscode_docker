const path = require ( 'path' );

module.exports = {
  // target: 'node',
  entry: './resources/index.js',
  mode : 'none',
  output: {
    path: path.resolve ( __dirname + '/resources'),
    filename: 'bundle.js',
    //libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['tsx', '.ts', '.jsx', '.js']
  },
  module: {
    rules: [
      { test: /\.ts$/,  exclude: /node_modules/, use: [ { loader: 'ts-loader' } ] },
      { test: /\.css$/, use: [ 'style-loader', 'css-loader' ] }
    ]
  }
}
