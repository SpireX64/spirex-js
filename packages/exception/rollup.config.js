const { terser } = require('rollup-plugin-terser')

const release = process.env.NODE_ENV === 'production'

const terserPlugin = terser({
    ecma: 5,
    compress: {
        module: true,
        toplevel: true,
        drop_console: true,
        drop_debugger: true
    }
})

exports.default = [
    {
        input: "Exception.js",
        output: {
            name: "Exception",
            file: "./build/Exception.js",
            format: 'umd',
            sourcemap: release ? 'inline' : false,
            plugins: [
                release && terserPlugin,
            ],
        },
    },
    {
        input: "Exception.js",
        output: {
            file: "./build/Exception.mjs",
            format: 'es',
            plugins: [
                release && terserPlugin,
            ],
        },
    },
    {
        input: "Exception.js",
        output: {
            file: "./build/Exception.cjs",
            format: 'cjs',
            plugins: [
                release && terserPlugin,
            ],
        },
    },
]
