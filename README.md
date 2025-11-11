# MineShare - Privacy-First Data Collection ⛏️

**Mine your data, manage it securely, trade it on the blockchain**

A privacy-first browser extension and decentralized marketplace that allows users to collect, manage, and trade their browsing data securely with full user control.

[![License](https://img.shields.io/badge/license-Educational-blue.svg)](LICENSE)
[![Sui Network](https://img.shields.io/badge/Sui-Testnet-00D4FF.svg)](https://sui.io)
[![Walrus Storage](https://img.shields.io/badge/Walrus-Storage-orange.svg)](https://walrus.site)

---

## 📁 Project Structure

```
MineShare/
├── docs/                    # 📚 All documentation
│   ├── ARCHITECTURE.md
│   ├── QUICKSTART.md
│   ├── DEPLOY_CONTRACT.md
│   └── ...
├── shared/                  # 🔧 Shared utilities & config
│   ├── config.js           # Centralized configuration
│   ├── utils.js            # Common utility functions
│   └── README.md
├── ui/                      # 🔐 Browser Extension
│   ├── src/
│   ├── manifest.json
│   └── README.md
├── dapp/                    # 🌐 Marketplace dApp
│   ├── src/
│   └── README.md
├── move/                    # 📜 Smart Contracts
│   └── mineshare/
│       ├── sources/
│       └── Move.toml
└── package.json            # Root workspace config
```

### 🔐 **ui/** - Browser Extension
A privacy-preserving Chrome extension for collecting browsing activity:
- Collects browsing data with user control
- Privacy-preserving (URL hashing, no sensitive data)
- Configurable data categories
- Export to marketplace for trading

**Tech**: React + Vite + Chrome Extension API  
**See**: [ui/README.md](ui/README.md)

### 🌐 **dapp/** - Marketplace dApp
Decentralized marketplace for trading browsing data:
- List datasets as NFTs on Sui blockchain
- Purchase and trade data with SUI tokens
- Encrypted storage on Walrus
- Connect with Sui wallet

**Tech**: React + Vite + Sui SDK + Walrus  
**See**: [dapp/README.md](dapp/README.md)

### 📜 **move/** - Smart Contracts
Blockchain contracts for marketplace functionality:
- Dataset NFT creation
- Listing and purchasing
- Ownership transfer
- Payment handling

**Tech**: Move language on Sui blockchain  
**See**: [move/README.md](move/README.md)

### 🔧 **shared/** - Common Code
Shared configuration and utilities:
- Centralized config (network, contracts, storage)
- Common utility functions
- Reduces code duplication

**See**: [shared/README.md](shared/README.md)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- Chrome browser (for extension)
- Sui CLI (for smart contracts)
- Sui wallet (for marketplace)

### Installation

```bash
# Install all dependencies
pnpm run install:all

# Or install individually
cd ui && pnpm install
cd ../dapp && pnpm install
```

### Development

```bash
# Build everything
pnpm run build:all

# Or work on specific parts
pnpm run build:ui      # Build browser extension
pnpm run build:dapp    # Build marketplace dApp
pnpm run build:contracts  # Build smart contracts

# Development mode
pnpm run dev:ui        # Watch mode for extension
pnpm run dev:dapp      # Dev server for dApp
```

### Load the Browser Extension

1. Build the extension: `cd ui && pnpm run build`
2. Open Chrome: `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `ui/dist/` directory

### Run the Marketplace dApp

```bash
cd dapp
pnpm run dev
# Open http://localhost:5173
```

---

## 🔒 Privacy Features

- **URLs are hashed** (SHA-256) before storage - never stores plain URLs
- **No keystroke or clipboard data** collected
- **Input fields excluded** - no passwords, form data, or sensitive text
- **User controls** - enable/disable globally or by category
- **Local storage only** - data never leaves your browser until you export
- **Per-domain management** - view and delete data for specific sites
- **Encrypted on Walrus** - data encrypted before upload to decentralized storage

---

## 📊 How It Works

```
┌─────────────────────┐
│   UI Extension      │ 1. Collect browsing data
│  (Data Collection)  │    (privacy-preserving)
└──────────┬──────────┘
           │
           ▼
   chrome.storage.local
   (Hashed URLs + metadata)
           │
           │ 2. User exports
           ▼
┌─────────────────────┐
│   dApp Marketplace  │ 3. Upload to Walrus
│  (Trading Platform) │    (encrypted storage)
└──────────┬──────────┘
           │
           │ 4. Mint NFT & create listing
           ▼
┌─────────────────────┐
│   Sui Blockchain    │ 5. Trade with SUI tokens
│  (Smart Contracts)  │    (ownership transfer)
└─────────────────────┘
```

---

## 🛠️ Development

### Project Scripts

| Command | Description |
|---------|-------------|
| `pnpm run build:all` | Build extension, dApp, and contracts |
| `pnpm run dev:all` | Watch mode for extension + dev server for dApp |
| `pnpm run clean:all` | Clean all build artifacts |
| `pnpm run test:contracts` | Test smart contracts |

### Configuration

All configuration is centralized in `shared/config.js`:
- Network settings (testnet/mainnet)
- Smart contract addresses
- Walrus endpoints
- dApp URL

Update once, applies everywhere!

---

## � Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get up and running fast
- **[Architecture](docs/ARCHITECTURE.md)** - System design and components
- **[Deploy Contract](docs/DEPLOY_CONTRACT.md)** - Deploy smart contracts
- **[Testing Guide](docs/TESTING_GUIDE.md)** - How to test the system
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and fixes

---

## 🌐 Current Deployment

- **Network**: Sui Testnet
- **Package ID**: `0xa220e3bf27fe8c285d1995fdc7d498ebe18650733c8d64ea436db244ab65fb89`
- **Module**: `marketplace`
- **Storage**: Walrus Testnet

See [docs/CONTRACT_DEPLOYED.md](docs/CONTRACT_DEPLOYED.md) for full deployment details.

---

## 🤝 Contributing

This is an educational project. Feel free to:
- Report issues
- Suggest improvements
- Fork and experiment

---

## 📝 License

This project is for educational purposes.

---

## 🙏 Acknowledgments

Built for privacy-conscious users who want control over their data.

**Technologies:**
- [Sui Blockchain](https://sui.io) - Fast, secure blockchain
- [Walrus Storage](https://walrus.site) - Decentralized storage
- [React](https://react.dev) - UI framework
- [Vite](https://vitejs.dev) - Build tool

---

**Note**: This project combines a data collection tool with a blockchain marketplace. The extension focuses on privacy-preserving data collection with full user control. The marketplace enables trading of aggregated, anonymized data.

