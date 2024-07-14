const { terser } = require('rollup-plugin-terser');
const { default: typescript } = require('@rollup/plugin-typescript');

const release = process.env.NODE_ENV === 'production'

const terserPlugin = release && terser({
    ecma: 5,
    compress: {
        module: true,
        toplevel: true,
        drop_console: true,
        drop_debugger: true
    }
})

const input = "./src/AppBoot.ts"

exports.default = [
    {
        input,
        output: {
            name: "AppBoot",
            file: "./build/AppBoot.js",
            format: 'umd',
            sourcemap: release ? 'inline' : false,
        },
        plugins: [
            typescript(),
            terserPlugin,
        ],
    },
    {
        input,
        output: {
            file: "./build/AppBoot.mjs",
            format: 'es',
        },
        plugins: [
            typescript({
                declaration: true,
                declarationDir: "./build",
                exclude: './src/*.test.ts',
            }),
            terserPlugin,
        ],
    },
    {
        input,
        output: {
            file: "./build/AppBoot.cjs",
            format: 'cjs',
        },
        plugins: [
            typescript(),
            terserPlugin,
        ],
    },
]
