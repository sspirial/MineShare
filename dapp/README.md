# MineShare Marketplace dApp

A decentralized marketplace for trading browsing data, built with Sui blockchain.

## Features

- 🔐 **Wallet Integration**: Connect with any Sui-compatible wallet (Sui Wallet, Suiet, Ethos, Martian, Slash)
- 📊 **Browse Listings**: Explore available data listings from other users
- 💰 **Buy & Sell**: Purchase data with SUI tokens or list your own
- 🔒 **Blockchain Secured**: All transactions secured by Sui blockchain
- 📦 **Walrus Storage**: Data stored on decentralized Walrus network

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Sui-compatible wallet extension installed in your browser

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Usage

1. **Connect Wallet**: Click the "Connect Wallet" button and select your Sui wallet
2. **Browse**: View available data listings in the marketplace
3. **Create Listing**: Use the MineShare browser extension to collect data, then create a listing in the dApp
4. **Purchase**: Buy datasets that interest you with SUI tokens

## Architecture

This dApp works together with the MineShare browser extension:

- **Extension**: Collects browsing data locally
- **dApp**: Handles wallet connection, listings, and transactions
- **Communication**: Extension exports data to dApp when creating listings

## Tech Stack

- **Frontend**: React + Vite
- **Blockchain**: Sui + @mysten/dapp-kit
- **Storage**: Walrus (decentralized blob storage)
- **State Management**: @tanstack/react-query

## Development

The dApp runs independently from the browser extension. During development:

1. Run the dApp: `pnpm dev` (opens on http://localhost:3000)
2. Install the MineShare extension in your browser
3. Use extension to collect data, then list it via the dApp

## Project Structure

```
dapp/
├── src/
│   ├── components/
│   │   ├── Marketplace.jsx    # Main marketplace component
│   │   ├── ListingCard.jsx    # Individual listing display
│   │   └── CreateListing.jsx  # Create new listing form
│   ├── App.jsx                # Sui dApp Kit setup
│   └── main.jsx               # Entry point
├── index.html
├── vite.config.js
└── package.json
```

## License

MIT
