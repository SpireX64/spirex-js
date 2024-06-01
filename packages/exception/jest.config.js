/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    displayName: "@spirex/js-exception",
    preset: "babel-jest",
    transform: {},
    testEnvironment: "node",
    clearMocks: true,
    coverageReporters: ['html'],
    coveragePathIgnorePatterns: ["<rootDir>/build/", "<rootDir>/node_modules/"],
    testPathIgnorePatterns: ["<rootDir>/build/", "<rootDir>/node_modules/"],
};
