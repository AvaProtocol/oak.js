module.exports = {
  moduleNameMapper: {
    "^@oak-network/(.*)$": "<rootDir>/packages/$1",
  },
  modulePathIgnorePatterns: [
    "<rootDir>/packages/api-augment",
    "<rootDir>/packages/types",
    "<rootDir>/packages/config",
    "<rootDir>/packages/adapter",
    "<rootDir>/packages/sdk",
  ],
  transformIgnorePatterns: ["node_modules/(?!@polkadot/.*)"],
};
