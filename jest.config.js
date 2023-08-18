module.exports = {
  transformIgnorePatterns: ['node_modules/(?!@polkadot/.*)'],
  modulePathIgnorePatterns: ["<rootDir>/packages/api-augment", "<rootDir>/packages/types"],
  moduleNameMapper: {
    "^@oak-network/(.*)$": "<rootDir>/packages/$1"
  },
};
