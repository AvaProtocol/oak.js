# oak.js OAK Network Javascript SDK
This Javascript library extends polkadot.js and provides typing information for OAK Network functionalities.

## Usage
Check out code snippet in [./demo/src](https://github.com/OAK-Foundation/oak.js/tree/main/demo/src) for Time Automation code, but put simply, below lines will add type check of OAK extrinsic to the existing polkadot.js library.

```
require('@oak-foundation/api-augment');
const { rpc, types } = require('@oak-foundation/types');
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
```

## Develop
If you would like to develop or test the code of this repo, follow the below guidelines.
### Install
`npm i`

### Run tests
By default the tests are targeting your local development environment, so before you run any command follow steps in [Quickstart: run Local Network with Zombienet](https://polkadot.js.org/apps/?rpc=ws%3A%2F%2F127.0.0.1%3A9946#/accounts) to build and run local relay chain and parachain.

Once the Turing Dev network is running, you should be able to see it on [polkadot.js.org/apps](https://polkadot.js.org/apps/?rpc=ws%3A%2F%2F127.0.0.1%3A9946#/accounts)

The default websocket endpoint is `ws://127.0.0.1:9946` and default test wallet is Alice, `6AwtFW6sYcQ8RcuAJeXdDKuFtUVXj4xW57ghjYQ5xyciT1yd`.

Now you should be able to start the test using
`npm run test`

The tests are not meant to run repeatedly against live networks, but you could run against Turing Staging environment with
```
ENV="Turing Staging" MNEMONIC="<MNEMONIC>" npm run test
```

You can specify the endpoint in Turing Dev environment.

```
MNEMONIC="<MNEMONIC>" ENDPOINT="ws://127.0.0.1:9944" npm run test
```
