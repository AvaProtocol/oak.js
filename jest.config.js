module.exports = {
  transformIgnorePatterns: ['node_modules/(?!@polkadot/.*)'],
  modulePathIgnorePatterns: [
    "<rootDir>/packages/api-augment",
    "<rootDir>/packages/types",
    "<rootDir>/packages/xcm-types",
    "<rootDir>/packages/xcm-config",
    "<rootDir>/packages/xcm-provider",
    "<rootDir>/packages/xcm-sdk"
  ],
  moduleNameMapper: {
    "^@oak-network/(.*)$": "<rootDir>/packages/$1"
  },
};
