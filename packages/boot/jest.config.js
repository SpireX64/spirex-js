/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    displayName: "@spirex/js-boot",
    preset: "ts-jest",
    testEnvironment: "node",
    clearMocks: true,
    testTimeout: 200,
    coverageDirectory: "<rootDir>/coverage",
    coveragePathIgnorePatterns: [
        "<rootDir>/build/",
        "<rootDir>/node_modules/",
        "<rootDir>/types/",
    ],
    testPathIgnorePatterns: [
        "<rootDir>/build/",
        "<rootDir>/node_modules/",
        "<rootDir>/types/",
    ],
};
