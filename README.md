# oak.js OAK Network JavaScript SDK

The `oak.js` library is a JavaScript extension of `polkadot.js` that provides type decorations for OAK Network functions. It requires the installation of the following packages:

- `@oak-network/api-augment`, available at [npmjs.com/@oak-network/api-augment](https://www.npmjs.com/package/@oak-network/api-augment)
- `@oak-network/types`, available at [npmjs.com/@oak-network/types](https://www.npmjs.com/package/@oak-network/types)

JavaScript and TypeScript developers can leverage this library to make OAK-specific API calls, such as `timeAutomation.scheduleXcmpTask`. For more information on OAK's unique API, refer to the [Time Automation Explained in Documentation](https://docs.oak.tech/docs/time-automation-explained/) guide.

## Usage

### Installation

To begin, determine the runtime version of the blockchain your code is connecting to. You can find the runtime version in the top-right corner of the [Polkadot.js app](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.turing.oak.tech).

![Runtime version in Polkadot.js](/media/runtime-version.png)

Next, locate the version number of the blockchain from the [OAK-blockchain Releases](https://github.com/OAK-Foundation/OAK-blockchain/releases) page. For example, in the "293 runtime & v1.9.0" release, "1.9.0" is the version number.

Run the following commands to install the required packages:

```bash
npm i @oak-network/api-augment@latest
npm i @oak-network/types@latest
```

### Including the Library in Your Code
To include the library in your code, refer to the code snippet provided in `./demo/src` for Time Automation code. In summary, the following lines will add type checking of OAK extrinsics to the existing `polkadot.js` library:
```
require('@oak-network/api-augment');
const { rpc, types } = require('@oak-network/types');
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
```

## Development
If you would like to develop or test the code in this repository, please follow the guidelines below.

### Installation
Run the following command to install the necessary dependencies:

```bash
npm i
```

### Running Tests
By default, the tests are configured to target your local development environment. Before running any commands, please follow the steps in the [Quickstart: run Local Network with Zombienet](https://polkadot.js.org/apps/?rpc=ws%3A%2F%2F127.0.0.1%3A9946#/accounts) guide to build and run a local relay chain and parachain.

Once the Turing Dev network is running, you should be able to see it on [polkadot.js.org/apps](https://polkadot.js.org/apps/?rpc=ws%3A%2F%2F127.0.0.1%3A9946#/accounts).

The default WebSocket endpoint is `ws://127.0.0.1:9946` and  the default test wallet is Alice (`6AwtFW6sYcQ8RcuAJeXdDKuFtUVXj4xW57ghjYQ5xyciT1yd`).

You can start the tests by running the following command:
```bash
npm run test
```

Please note that the tests are not meant to be repeatedly run against live networks. However, you can run them against the Turing Staging environment using the following command:
```bash
ENV="Turing Staging" MNEMONIC="<MNEMONIC>" npm run test
```

You can also specify the endpoint in the Turing Dev environment:

```bash
MNEMONIC="<MNEMONIC>" ENDPOINT="ws://127.0.0.1:9944" npm run test
```

## Updating the packages
To update the code of both packages in this repository, you will first need to run a local version of the Turing Network. Then, using a script and leveraging the chain's API, you can automatically update the TypeScript code in the packages.

## 1. Run Turing Network Locally
Follow the instructions in the [OAK-blockchain GitHub repository](https://github.com/OAK-Foundation/OAK-blockchain) to clone the source code and set up the Rust version. Build and run the project. Additionally, set up zombienet to spawn a local network. Assuming zombienet is installed and you are in the `OAK-blockchain` directory, run the following command:


```bash
zombienet spawn zombienets/turing/single-chain.toml
```

## 2. Update Packages
You are now ready to update the packages' code in this oak.js project. From the root of this project, run the following commands:

```bash
npm install
cd packages/api-augment
npm run clean:defs
npm run generate
```

## 3. Rebuilding packages

The last step is to build the packages' source code in preparation for publishing. Navigate back to the root of the oak.js directory and run the following commands:

```bash
npm run clean
npm run build
```

The build command will generate distribution files under `packages/api-augment/build`.

## Publishing the Packages
Note: Only the @oak-network developer team on [npmjs.com](https://www.npmjs.com/) has the rights to publish new versions.

Run the following command to publish the packages:

```bash
npm run publish -- <publish_version> <2fa_code>
```

- The first parameter, `<publish_version>`, should match the OAK-blockchain code version. If the version string is like `1.9.0-rc.1`, it will be tagged with `rc` when uploaded to npm.
- The second parameter, `<2fa_code>`, is the Two-Factor Authenticator code of your npmjs.com account, which is enforced when joining the @oak-network team.

You should receive an email from `support@npmjs.com` if the package is successfully published.
