# Developer's notes

## Common dev-dependencies

| NPM Library                 | Version | Required for/as...                      |
|-----------------------------|---------|-----------------------------------------|
| `jest`                      | 29.7.0  | Unit tests runner                       |
| `@types/jest`               | 29.7.0  | Type definitions for jest               |
| `ts-jest`                   | 29.1.2  | Jest runner for TypeScript              |
| `rollup`                    | 4.17.2  | Package bundler                         |
| `rollup-plugin-terser`      | 7.0.2   | Package bundle minifier                 |
| `@rollup/plugin-typescript` | 11.1.6  | TypeScript support for Rollup           |
| `typescript`                | 5.4.5   | Check & compile *.ts files              |
| `tslib`                     | 2.6.3   | Required by `@rollup/plugin-typescript` |
| `@babel-jest`               | 29.7.0  | ES Modules support for Jest             |
| `@babel/preset-env`         | 7.24.8  | Required by `@babel-ject`               |
| `prettier`                  | 3.5.2   | JS/TS code formatter                    |
| `eslint`                    | 9.3.0   | JS/TS code validator                    |
| `@eslint/js`                | 9.3.0   | Recommended JS rules for ESLint         |
| `typescript-eslint`         | 7.9.0   | TypeScript files support for ESLint     |
