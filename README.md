# MineShare - Privacy-First Data Trading Extension ⛏️

**Mine your data, share your wealth**

A privacy-first browser extension that allows users to collect, manage, and trade their browsing data securely through a decentralized marketplace.

## 🎨 Brand Identity

**MineShare** transforms your browsing data into valuable assets while maintaining complete privacy control.

- **Primary Color**: Gold (#FFD700) - Represents value and wealth creation
- **Accent Color**: Purple (#6A0DAD) - Symbolizes privacy and sophistication
- **Typography**: Poppins Bold (headings) + Inter (body text)
- **Icon**: Pickaxe (⛏️) - Symbolizing data mining and user empowerment

## 🎯 Features

### Data Collection

- **Privacy-Preserving**: URLs hashed with SHA-256 before storage
- **Configurable**: Toggle collection categories on/off
- **Transparent**: User controls what data is collected
- **Categories Collected**:
  - URLs (stored as hashes only)
  - Page titles
  - Time spent on pages
  - Click and scroll interactions
  - Referring domains
  - Session tracking
  - Page categories (news, shopping, social, etc.)
  - Keywords from visible page text (excluding form inputs)

### Marketplace

- **List Data**: Create listings for your collected data
- **Browse & Buy**: Discover and purchase datasets from other users
- **Wallet Integration**: Connect wallet for secure transactions
- **Transaction History**: Track purchases and sales
- **Earnings Dashboard**: View your marketplace earnings

### Security & Privacy

- **No Red-Zone Data**: Never collects passwords, keystrokes, clipboard, or form inputs
- **URL Hashing**: All URLs hashed before storage (domain kept for categorization)
- **Local First**: Data stored locally in chrome.storage.local
- **Blockchain Ready**: Hooks for Web3 wallet integration
- **Transparent**: Full user control over data collection

## 📦 Installation

### Load Unpacked Extension (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension directory

## 🚀 Usage

### For Data Collectors (Sellers)

1. **Enable Collection**
   - Open extension popup
   - Navigate to "Collection" tab
   - Enable data collection
   - Select categories to collect
   - Click "Save Settings"

2. **Create Listing**
   - Browse websites to collect data
   - Navigate to "My Listings" tab
   - Click "+ Create Listing"
   - Fill in listing details (title, description, price)
   - Submit listing

3. **Manage Listings**
   - View active and sold listings
   - Check earnings in stats dashboard
   - Delete listings if needed

### For Data Buyers

1. **Connect Wallet**
   - Open extension popup
   - Click "Connect Wallet" (simulated in MVP)
   - In production, connect MetaMask or Web3 wallet

2. **Browse Marketplace**
   - Navigate to "Marketplace" tab
   - Filter by data type
   - Search listings
   - View dataset details

3. **Purchase Data**
   - Click "Buy Now" on desired listing
   - Review purchase details
   - Confirm transaction
   - Data delivered after successful payment

## 🏗️ Architecture

### File Structure
```
mineshare-extension/
├── manifest.json                    # Extension configuration
├── README.md                        # This file
├── STRUCTURE.md                     # Detailed structure documentation
│
├── src/                             # Source code
│   ├── background.js                # Service worker (data collector)
│   ├── content_script.js            # Page interaction tracker
│   ├── ui/                          # User interface
│   │   ├── popup.html               # Popup (400px, gold/purple)
│   │   ├── popup.js                 # Popup controller
│   │   ├── options.html             # Full-screen marketplace
│   │   └── options.js               # Options controller
│   ├── api/                         # Business logic
│   │   ├── marketplace.js           # Marketplace API
│   │   └── data_api.js              # Data aggregation
│   └── types/                       # TypeScript definitions
│       └── types.d.ts               # Type definitions
│
├── assets/                          # Static assets
│   ├── icons/                       # Extension icons
│   │   ├── icon16.png               # 16x16 toolbar
│   │   ├── icon48.png               # 48x48 management
│   │   └── icon128.png              # 128x128 store
│   └── styles/                      # Stylesheets
│       └── mineshare.css            # Complete design system
│
└── docs/                            # Documentation
    ├── MINESHARE_REBRAND.md         # Brand guidelines
    ├── IMPLEMENTATION_SUMMARY.md    # Technical guide
    └── VISUAL_PREVIEW.md            # Design reference
```

> 📘 See [STRUCTURE.md](STRUCTURE.md) for detailed documentation on the project organization.

### Key Components

#### 1. Marketplace API (`marketplace.js`)
Production-ready module with:
- **WalletService**: Wallet connection and transaction signing
- **ListingService**: CRUD operations for listings
- **TransactionService**: Purchase flow and transaction management
- **DataCollectionHelper**: Interface with collected data

#### 2. Background Service Worker (`background.js`)
- Listens to navigation events
- Hashes URLs before storage
- Tracks sessions and interactions
- Respects user preferences
- Stores events in chrome.storage.local

#### 3. Content Script (`content_script.js`)
- Captures click and scroll interactions
- Measures dwell time
- Extracts keywords from visible text
- **Avoids**: input fields, textareas, contenteditable elements
- Sends sanitized events to background

## 🔐 Privacy & Security

### Data Collection Rules
✅ **Allowed**:
- Page URLs (hashed)
- Page titles
- Time metrics
- Click/scroll depth
- Navigation flow
- Public visible text
- Browser metadata

❌ **Forbidden**:
- Passwords
- Auth tokens
- Keystrokes
- Form inputs
- Clipboard content
- User fingerprinting

## 🌐 Walrus Blockchain Integration

This build ships with a lightweight Walrus adapter to commit dataset fingerprints and optionally record purchase receipts.

### What it does
- On listing creation, MineShare computes a SHA-256 hash of your locally collected, sanitized events and stores it as a dataHash.
- If Walrus is enabled, MineShare sends a commit request to your configured Walrus endpoint and stores the returned commitment CID and tx hash in the listing metadata.
- On purchase, MineShare optionally records a purchase receipt with Walrus and attaches the receipt id to the transaction.

### Configure Walrus
1. Open the full-page UI (right-click the extension → Options) and go to Settings.
2. In the "Walrus Blockchain" section:
   - Toggle "Enable Walrus Integration".
   - Set Base URL to your Walrus HTTP endpoint or proxy (e.g., https://api.your-walrus.example).
   - Optionally set an API key (sent as Bearer token).
   - Click "Test Connection" to verify reachability.

Notes:
- The MV3 build avoids bundlers; the adapter uses fetch. You can later swap it to use @mysten/walrus when introducing a bundler.
- If Walrus is disabled or unreachable, the adapter falls back to a simulated flow and still stores the local dataHash.

### Where it appears in the UI
- Listings show a Walrus badge with the first characters of the commitment CID when available (or "Simulated").
- Transactions may include a walrusReceiptId.

### Security & Privacy
- The committed hash is derived from locally stored sanitized events (consistent with your collection settings). No raw sensitive inputs are sent.
- You can disable collection or specific categories at any time.

## 🌐 Blockchain Integration (Future)

### Current Implementation
- Simulated wallet connection
- Placeholder transaction signing
- Local storage for listings/transactions

### Production Integration Steps
1. **Install Web3 Library**
   ```bash
   npm install ethers
   ```

2. **Update WalletService** (`marketplace.js`)
   ```javascript
   async connect() {
     const provider = new ethers.providers.Web3Provider(window.ethereum);
     const accounts = await provider.send("eth_requestAccounts", []);
     this.address = accounts[0];
     return { success: true, address: this.address };
   }
   ```

3. **Deploy Smart Contract**
   - Create Solidity contract for marketplace
   - Deploy to testnet (Goerli, Sepolia)
   - Update `MARKETPLACE_CONFIG.blockchain.contractAddress`

## 📊 API Reference

### Marketplace API

```javascript
// Access via window.MarketplaceAPI

// Wallet
await MarketplaceAPI.wallet.connect();
await MarketplaceAPI.wallet.disconnect();
await MarketplaceAPI.wallet.getStatus();

// Listings
await MarketplaceAPI.listing.createListing(data);
await MarketplaceAPI.listing.getAllListings();
await MarketplaceAPI.listing.getMyListings(sellerId);
await MarketplaceAPI.listing.deleteListing(listingId);

// Transactions
await MarketplaceAPI.transaction.purchaseListing(listingId, buyerId, wallet);
await MarketplaceAPI.transaction.getTransactions(userId);
await MarketplaceAPI.transaction.getEarnings(sellerId);

// Data Helper
await MarketplaceAPI.dataHelper.getCollectedDataInfo();
```

## 🛠️ Development

### Prerequisites
- Chrome/Chromium browser
- Node.js (for future tooling)
- Code editor (VS Code recommended)

### Local Development
1. Make changes to source files
2. Reload extension in `chrome://extensions/`
3. Test changes

### TypeScript Migration
- Types defined in `types.d.ts`
- Ready for TS conversion
- Install: `npm install -D typescript @types/chrome`

## 🚧 Roadmap

### Phase 1: MVP (Current) ✅
- [x] Data collection with privacy controls
- [x] Local storage simulation
- [x] Marketplace UI (popup + options)
- [x] Listing creation and management
- [x] Purchase flow simulation
- [x] TypeScript definitions

### Phase 2: Blockchain Integration
- [ ] MetaMask integration
- [ ] Smart contract deployment
- [ ] Real blockchain transactions
- [ ] IPFS/Walrus data storage pipelines
- [ ] Escrow system

### Phase 3: Advanced Features
- [ ] Data encryption
- [ ] Zero-knowledge proofs
- [ ] Reputation system
- [ ] Bulk purchases
- [ ] Subscription models
- [ ] Analytics dashboard

## 📄 License

MIT License

## ⚠️ Disclaimer

This extension is for educational and research purposes. Users are responsible for compliance with applicable data protection laws (GDPR, CCPA, etc.). Always obtain proper consent before collecting or selling user data.

---

**MineShare** - Mine your data, share your wealth ⛏️  
**Version**: 1.0.0 (MineShare Rebrand)  
**Last Updated**: 2025-11-09  
**Status**: MVP Ready / Blockchain Integration Pending

