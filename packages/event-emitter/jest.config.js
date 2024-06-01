/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    displayName: "@spirex/js-event-emitter",
    preset: "ts-jest",
    testEnvironment: "node",
    clearMocks: true,
    coverageDirectory: "<rootDir>/../coverage",
    coveragePathIgnorePatterns: ["<rootDir>/build/", "<rootDir>/node_modules/", "<rootDir>/types/"],
    testPathIgnorePatterns: ["<rootDir>/build/", "<rootDir>/node_modules/", "<rootDir>/types/"],
};
