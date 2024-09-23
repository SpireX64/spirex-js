const { terser } = require("rollup-plugin-terser");
const { default: typescript } = require("@rollup/plugin-typescript");
const { globSync } = require("glob");

const release = process.env.NODE_ENV === "production";

const terserPlugin =
    release &&
    terser({
        ecma: 5,
        compress: {
            module: true,
            toplevel: true,
            drop_console: true,
            drop_debugger: true,
        },
    });

const input = globSync("src/*.ts");
const outDir = "./build";

exports.default = [
    {
        input,
        output: {
            name: "@spirex/js-utils",
            file: `${outDir}/amd/index.js`,
            format: "umd",
            sourcemap: release ? "inline" : false,
        },
        plugins: [typescript(), terserPlugin],
    },
    {
        input,
        output: {
            dir: `${outDir}/es`,
            format: "es",
        },
        plugins: [
            typescript({
                declaration: true,
                declarationDir: `${outDir}/es`,
                exclude: "./src/*.test.ts",
            }),
            terserPlugin,
        ],
    },
    {
        input,
        output: {
            dir: `${outDir}/cjs`,
            format: "cjs",
        },
        plugins: [typescript(), terserPlugin],
    },
];
