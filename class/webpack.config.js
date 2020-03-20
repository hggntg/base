var path = require('path');
module.exports = {
    // the main source code file
    entry: './.generated/src/index.ts',
    output: {
        // the output file name
        filename: 'index.js',
        // the output path               
        path: path.resolve(__dirname, 'dist')
    },
    mode: "production",
    resolve: { 
        extensions: ['.ts', '.js', '.json'],
        alias: {
            "@app": path.resolve(__dirname, '.generated/src')
        } 
    },
    module: {
        rules: [
            // all files with a `.ts` extension will be handled by `ts-loader`
            { test: /\.ts$/, loader: 'ts-loader' }
        ]
    }
};