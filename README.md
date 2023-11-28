# oak.js OAK Network JavaScript SDK

The `oak.js` library is a JavaScript extension of `polkadot.js`.

It provides type decorations for OAK Network functions. It requires the installation of the following packages:
- `@oak-network/api-augment`, available at [npmjs.com/@oak-network/api-augment](https://www.npmjs.com/package/@oak-network/api-augment)
- `@oak-network/types`, available at [npmjs.com/@oak-network/types](https://www.npmjs.com/package/@oak-network/types)

JavaScript and TypeScript developers can leverage this library to make OAK-specific API calls, such as `timeAutomation.scheduleXcmpTask`. For more information on OAK's unique API, refer to the [Time Automation Explained in Documentation](https://docs.oak.tech/docs/time-automation-explained/) guide.

In addition, it provides an SDK to help developers simplify the use of automation. It includes the following packages:
- `@oak-network/sdk-types`, available at [npmjs.com/@oak-network/sdk-types](https://www.npmjs.com/package/@oak-network/sdk-types)
- `@oak-network/config`, available at [npmjs.com/@oak-network/config](https://www.npmjs.com/package/@oak-network/config)
- `@oak-network/adapter`, available at [npmjs.com/@oak-network/adapter](https://www.npmjs.com/package/@oak-network/adapter)
- `@oak-network/sdk`, available at [npmjs.com/@oak-network/sdk](https://www.npmjs.com/package/@oak-network/sdk)

## Usage for the Foundational library 

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

## Usage of the SDK Library

### Installation

Run the following commands to install the required packages:

```bash
npm i @oak-network/sdk-types@latest
npm i @oak-network/config@latest
npm i @oak-network/adapter@latest
npm i @oak-network/sdk@latest
```

### Developing Applications with the SDK

To develop applications using the SDK, you can refer to the test code as an example. Here's a step-by-step guide:

- Start by exporting configurations from @oak-network/config.

- Construct a Polkadot API.

- Build and initialize an adapter. Utilize the methods provided by the adapter for standard operations. 

- For more complex operations that involve data exchange between multiple adapters, such as `scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow`, you can leverage the functions provided by the SDK package.

For example:

```
// Create keyringPair
keyringPair = await getKeyringPair();

// Get configs
const turingConfig = getOakConfig();
const mangataConfig = getMangataConfig();

// Initialize adapters
turingApi = await ApiPromise.create({ provider: new WsProvider(turingConfig.endpoint), rpc, types, runtime });
turingAdapter = new OakAdapter(turingApi, turingConfig);
await turingAdapter.initialize();

mangataSdk = Mangata.getInstance([mangataConfig.endpoint]);
mangataApi = await mangataSdk.getApi();
mangataAdapter = new MangataAdapter(mangataApi, mangataConfig);
await mangataAdapter.initialize();

// Make task payload extrinsic
const taskPayloadExtrinsic = mangataApi.tx.system.remarkWithEvent('hello!');

// Schedule task with sdk
const executionTimes = [getHourlyTimestamp(1)/1000];
await Sdk().scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
	oakAdapter: turingAdapter,
	destinationChainAdapter: mangataAdapter,
	taskPayloadExtrinsic,
	schedule: { Fixed: { executionTimes } },
	keyringPair,
});
```

## Development
If you would like to develop or test the code in this repository, please follow the guidelines below.

### Installation
Run the following command to install the necessary dependencies:

```bash
yarn # Please use yarn to install dependencies due to the use of Yarn Workspace
```

### Running Foundational Tests
By default, the tests are configured to target your local development environment. Before running any commands, please follow the steps in the [Quickstart: run Local Network with Zombienet](https://polkadot.js.org/apps/?rpc=ws%3A%2F%2F127.0.0.1%3A9946#/accounts) guide to build and run a local relay chain and parachain.

Once the Turing Dev network is running, you should be able to see it on [polkadot.js.org/apps](https://polkadot.js.org/apps/?rpc=ws%3A%2F%2F127.0.0.1%3A9946#/accounts).

The default WebSocket endpoint is `ws://127.0.0.1:9946` and  the default test wallet is Alice (`6AwtFW6sYcQ8RcuAJeXdDKuFtUVXj4xW57ghjYQ5xyciT1yd`).

You can start the tests by running the following command:
```bash
yarn run test
```

Please note that the tests are not meant to be repeatedly run against live networks. However, you can run them against the Turing Staging environment using the following command:
```bash
ENV="Turing Staging" MNEMONIC="<MNEMONIC>" yarn run test
```

You can also specify the endpoint in the Turing Dev environment:

```bash
MNEMONIC="<MNEMONIC>" ENDPOINT="ws://127.0.0.1:9944" yarn run test
```

### SDK Tests

You can start the tests by running the following command:

```bash
MNEMONIC="<MNEMONIC>" ENV="Turing Staging" yarn run test:sdk
```

If you wish to perform local testing, you'll need to launch the parachain test network yourself using the following command:

```bash
zombienet spawn zombienets/turing/moonbase.toml
```

This command will initiate the test network for parachains.

Then, you'll need to specify a test suite since each suite executes tests for a single parachains.

```bash
yarn run test:sdk -- -t test-mangata
```

### Compound Tests

If you wish to perform local testing, you'll need to launch the parachain test network yourself using the following command:

```bash
zombienet spawn zombienets/turing/single-chain.toml
```

If the account hasn't been delegated on-chain yet, you can execute the following command to test the `delegateWithAutoCompound` interface.

```bash
MNEMONIC="<MNEMONIC>" ENV="Turing Dev" yarn run test:delegate
```

If the account has already been delegated on-chain, or if you've previously tested the `delegateWithAutoCompound` interface, you can execute the following command to test the `delegatorBondMore`, `setAutoCompound`, `getDelegation`, and `getAutoCompoundingDelegationPercentage` interfaces.

```bash
MNEMONIC="<MNEMONIC>" ENV="Turing Dev" yarn test:compound
```



## File structure

```
.
├── LICENSE
├── README.md
├── babel.config.js
├── demo
├── jest.config.js
├── media
├── package.json
├── packages
│   ├── adapter
│   ├── api-augment
│   ├── config
│   ├── sdk
│   ├── sdk-types
│   └── types
├── scripts
│   └── package-setup
├── templates
│   └── index.cjs
├── test
│   ├── functional
│   ├── sdk
│   └── utils
├── tsconfig.build.json
├── tsconfig.json
```

- `packages`: It store individual code libraries for various parts of the project.
- `scripts/package-setup`:  It is a script used for building packages. It utilizes templates/index.cjs as a script.
- `test`: The `test` folder contains test programs. `test/functional` is used for testing the Foundational library, while `test/sdk` is used for testing the SDK library.
- `demo`: It contains example code for developers to learn from.

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
yarn
cd packages/api-augment
yarn run clean:defs
yarn run generate
```

## 3. Rebuilding packages

The last step is to build the packages' source code in preparation for publishing. Navigate back to the root of the oak.js directory and run the following commands:

```bash
yarn run clean
yarn run build
```

The build command will generate distribution files under `packages/api-augment/build`.

## Publishing the Packages

The release creation and publishing process is managed by GitHub Actions. It's important to note that package versions don't need to be consistent across all packages. For example, if changes are made to the `api-augment` library, there's no requirement to bump the version of the `types` library as well.

To publish packages, please follow the steps outlined below:

1. **Generate Changeset Marking File:**
   To initiate a version update, start by running the command `npm run changeset` locally. This action will create a marking file in the `./changeset` directory. An example of such a change can be found in this PR: [example PR link](https://github.com/OAK-Foundation/oak.js/commit/c35050eb16bb73251fb05dd9010ab577f2adf5d6).

2. **Automated Package Version Update:**
   After the aforementioned PR is merged into the `main` branch, a GitHub Action will be triggered by the created marking file. This action will automatically generate a new PR, updating the versions of all packages simultaneously. You can observe this process in action with this PR: [example PR link](https://github.com/OAK-Foundation/oak.js/pull/42). Should you need to add additional changes to the same version, simply repeat step 1 to create another marking file and merge it into the `main` branch. The original PR associated with the `main` branch will be updated automatically. Furthermore, a corresponding **git tag** will be generated for each package as part of this process.

3. **Testing with Dev Version:**
   If everything appears satisfactory, proceed to merge the above-mentioned PR. Following the successful merge, manually trigger the **Publish dev version** workflow. This will lead to the publishing of an NPM package version with the `dev` tag, facilitating thorough testing.

4. **Updating to Latest Tag:**
   Once confident with the outcome of the dev testing phase, manually initiate the **Update dev tag to latest** workflow. This workflow will update the npm tag from `dev` to `latest`, signifying the readiness of the package for broader use.

You should receive an email from `support@npmjs.com` if the package is successfully published.
