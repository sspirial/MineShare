# MineShare Smart Contracts

This folder contains the Move smart contracts for the MineShare marketplace on the Sui blockchain.

## Structure

```
move/
└── mineshare/
    ├── Move.toml          # Package configuration
    ├── sources/           # Smart contract source code
    │   └── mineshare.move # Main marketplace contract
    └── build/             # Build artifacts (git-ignored)
```

## Building the Contracts

```bash
cd mineshare
sui move build
```

## Testing the Contracts

```bash
cd mineshare
sui move test
```

## Deploying the Contracts

See [docs/DEPLOY_CONTRACT.md](../docs/DEPLOY_CONTRACT.md) for detailed deployment instructions.

## Current Deployment

- **Network**: Testnet
- **Package ID**: `0xa220e3bf27fe8c285d1995fdc7d498ebe18650733c8d64ea436db244ab65fb89`
- **Module**: `marketplace`

See [docs/CONTRACT_DEPLOYED.md](../docs/CONTRACT_DEPLOYED.md) for full deployment details.

## Contract Overview

The marketplace contract handles:
- Creating data listings with metadata and pricing
- Purchasing data with SUI tokens
- Storing data on Walrus decentralized storage
- Managing listing ownership and transfers

## Prerequisites

- [Sui CLI](https://docs.sui.io/build/install)
- Active Sui wallet with testnet SUI tokens
- Basic understanding of Move language
