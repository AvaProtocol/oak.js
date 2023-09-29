module.exports = {
  transformIgnorePatterns: ["node_modules/(?!@polkadot/.*)"],
  modulePathIgnorePatterns: [
    "<rootDir>/packages/api-augment",
    "<rootDir>/packages/types",
    "<rootDir>/packages/sdk-types",
    "<rootDir>/packages/config",
    "<rootDir>/packages/adapter",
    "<rootDir>/packages/sdk",
  ],
  moduleNameMapper: {
    "^@oak-network/(.*)$": "<rootDir>/packages/$1",
  },
};
