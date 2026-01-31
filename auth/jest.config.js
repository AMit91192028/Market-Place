/**@type {import('jest').Config} */
module.exports = {

testEnvironment: 'node',
transform:{},
testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],

setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

collectCoverageFrom: ['src/**/*.js', '!src/**/index.js'],

verbose: true,
};