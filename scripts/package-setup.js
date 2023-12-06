#!/usr/bin/env node
const fs = require("fs");

console.log("Postbuild script starts: setting up build folders of packages...");

/* eslint-disable sort-keys */
const packages = [
  { name: "api-augment", main: "./index.cjs", module: "./index.js", types: "./index.d.ts", copyFile: true },
  { name: "types", main: "./index.js", module: null, types: "./index.d.ts", copyFile: false },
  { name: "config", main: "./index.js", module: null, types: "./index.d.ts", copyFile: true },
  { name: "sdk", main: "./index.js", module: null, types: "./index.d.ts", copyFile: true },
  { name: "adapter", main: "./index.js", module: null, types: "./index.d.ts", copyFile: true },
];

packages.forEach((pkg) => {
  const pkgPath = `packages/${pkg.name}/build`;
  process.chdir(pkgPath);

  const packageJson = JSON.parse(fs.readFileSync("../package.json"));
  packageJson.scripts = {};
  packageJson.main = pkg.main;
  if (pkg.module) packageJson.module = pkg.module;
  packageJson.types = pkg.types;

  // Remove the 'workspace:' protocol if exists in dependencies
  // Only config and adapter packages are depended by others
  if (packageJson.dependencies && packageJson.dependencies["@oak-network/config"]) {
    const version = packageJson.dependencies["@oak-network/config"].replace("workspace:", "");
    packageJson.dependencies["@oak-network/config"] = version;
  }

  if (packageJson.dependencies && packageJson.dependencies["@oak-network/adapter"]) {
    const version = packageJson.dependencies["@oak-network/adapter"].replace("workspace:", "");
    packageJson.dependencies["@oak-network/adapter"] = version;
  }

  fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 2));

  if (pkg.copyFile) {
    fs.copyFileSync("../../../templates/index.cjs", "./index.cjs");
  }

  process.chdir("../../.."); // Going back to the root directory
});

console.log("Postbuild setup completed.");
