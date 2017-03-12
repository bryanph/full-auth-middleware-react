var path = require('path');
var webpack = require('webpack')

module.exports = {
    // devtool: 'cheap-module-eval-source-map',
    devtool: 'inline-eval-cheap-source-map',

    entry: {
        auth: [
            // 'webpack-hot-middleware/client?path=http://localhost:3000/__webpack_hmr',
            // 'babel-polyfill',
            './client/auth/app.js', 
        ],
    },
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[id].bundle.js',
        path: path.join(__dirname, 'public'),
        publicPath: 'http://localhost:3000/static/'
        // publicPath: '/static/'
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ],
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loaders: ['babel-loader'],
                exclude: /(node_modules|bower_components)/,
                // include: path.join(__dirname, 'client')
            },
            { test: /\.coffee/, loaders: ['coffee-loader'] },
            { test: /\.json/, loaders: ['json'] },
            { test: /\.css$/, loaders: ['style', 'css'] },
            { test: /\.scss$/, loaders: ['style', 'css', 'sass'] },
            { test: /\.png$/, loader: "url-loader?limit=100000" },
            { test: /\.jpg$/, loader: "file-loader?name=[path][name]" },
            { test: /\.svg/, loader: "file-loader" }
        ]
    },
  resolve: {
        alias: {
            styles: path.join(__dirname, './client/scss') 
        },
    },
  sassLoaders: {
        includePaths: [
            path.resolve(__dirname, './client/scss'),
            path.resolve(__dirname, './public'),
        ]
    },
}
