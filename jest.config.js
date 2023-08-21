module.exports = {
  transformIgnorePatterns: ['node_modules/(?!@polkadot/.*)'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    "<rootDir>/packages/api-augment",
    "<rootDir>/packages/types",
    "<rootDir>/packages/xcm-types",
    "<rootDir>/packages/xcm-config",
    "<rootDir>/packages/xcm-provider"
  ],
  moduleNameMapper: {
    "^@oak-foundation/(.*)$": "<rootDir>/packages/$1"
  },
};
