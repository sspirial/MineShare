# MineShare Integration Guide

This document explains the complete integration between the MineShare browser extension, dApp, and smart contract.

## Architecture Overview

```
┌─────────────────────┐
│   Extension (UI)    │
│  Data Collection    │
│   & Export          │
└──────────┬──────────┘
           │
           │ 1. Collect browsing data
           │ 2. Encrypt & upload to Walrus
           │ 3. Mint Dataset NFT
           │
           ▼
┌─────────────────────┐
│   Smart Contract    │
│   (Sui Blockchain)  │
│                     │
│  • mint_dataset     │◄───┐
│  • create_listing   │    │
│  • buy_listing      │    │
│  • claim_dataset    │    │
│  • collect_proceeds │    │
└──────────┬──────────┘    │
           │                │
           │ 4. Create listing
           │ 5. Buy/Sell     │
           │ 6. Transfer     │
           │                │
           ▼                │
┌─────────────────────┐    │
│    dApp (Web UI)    │────┘
│   Marketplace       │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   Walrus Storage    │
│  Encrypted Datasets │
└─────────────────────┘
```

## Smart Contract Functions

### Function Distribution

| Function | Called From | User Role | Purpose |
|----------|------------|-----------|---------|
| `mint_dataset` | **Extension** | Data Owner | Create Dataset NFT with encrypted data reference |
| `create_listing` | **dApp** | Seller | List a dataset for sale |
| `buy_listing` | **dApp** | Buyer | Purchase a listed dataset |
| `claim_dataset` | **dApp** | Buyer | Receive purchased dataset |
| `collect_proceeds` | **dApp** | Seller | Withdraw sales revenue |

## User Flows

### Flow 1: Selling Data (Extension → dApp)

**Extension Side:**
1. User collects browsing data using the extension
2. User clicks "Export Data to Marketplace" in extension popup
3. Extension:
   - Aggregates collected data using `data_api.js`
   - Encrypts data (stores encryption key locally)
   - Uploads to Walrus → receives `blobId`
   - Calls `mint_dataset(cidBytes, metadata)` 
   - Dataset NFT created and sent to user's wallet
4. Extension opens dApp automatically

**dApp Side:**
5. User navigates to "Create Listing" tab
6. dApp detects available Dataset NFTs in wallet
7. User selects dataset, sets price, adds description
8. dApp calls `create_listing(dataset, price)`
9. Listing appears in marketplace

### Flow 2: Buying Data (dApp Only)

**Buyer:**
1. Browse marketplace listings
2. Click "Purchase" on desired dataset
3. dApp calls `buy_listing(listing, payment)`
4. dApp automatically calls `claim_dataset(listing)`
5. Dataset NFT transferred to buyer's wallet
6. Buyer can decrypt data using Walrus CID

**Seller:**
7. View "My Listings" tab
8. See accumulated balance on sold listings
9. Click "Collect Proceeds"
10. dApp calls `collect_proceeds(listing)`
11. SUI transferred to seller's wallet

## File Structure

### Extension (`/ui`)

```
ui/src/
├── api/
│   ├── data_api.js       # Data aggregation
│   ├── walrus_api.js     # Walrus upload/download + encryption
│   └── sui_api.js        # Blockchain interactions (mint_dataset)
├── pages/
│   ├── PopupApp.jsx      # Main popup with export functionality
│   └── OptionsApp.jsx    # Full options page
├── config.js             # Configuration (package ID, network)
└── ...
```

### dApp (`/dapp`)

```
dapp/src/
├── api/
│   ├── sui_api.js        # All smart contract functions
│   └── walrus_api.js     # Walrus download + decryption
├── components/
│   ├── Marketplace.jsx   # Main marketplace container
│   ├── CreateListing.jsx # Create listing form (calls create_listing)
│   └── ListingCard.jsx   # Buy/Claim/Collect buttons
├── config.js             # Configuration
└── App.jsx              # Sui dApp Kit setup
```

## API Reference

### Extension APIs

#### `walrus_api.js`
```javascript
uploadToWalrus(data, encryptionKey) 
  → { blobId, encryptionKey, size }

downloadFromWalrus(blobId, encryptionKey) 
  → decryptedData

blobIdToBytes(blobId) 
  → Array<number>
```

#### `sui_api.js`
```javascript
mintDataset(cidBytes, metadata, walletApi) 
  → { digest, datasetId }

getOwnedDatasets(address) 
  → Array<Dataset>
```

### dApp APIs

#### `sui_api.js`
```javascript
createListing(datasetId, priceInSui, walletApi) 
  → { digest, listingId }

buyListing(listingId, priceInSui, walletApi, buyerAddress) 
  → { digest }

claimDataset(listingId, walletApi, buyerAddress) 
  → { digest, datasetId }

collectProceeds(listingId, walletApi) 
  → { digest }

getAllListings() 
  → Array<Listing>
```

## Configuration

Update these files to change networks or contract addresses:

### `/ui/src/config.js`
```javascript
export const CONFIG = {
  NETWORK: 'testnet',
  PACKAGE_ID: '0x2cf73e2764bedfd840acd574a89ac4e3e34c77992a3565ed2da3853543dd9243',
  MODULE_NAME: 'marketplace',
  WALRUS_PUBLISHER: 'https://publisher.walrus-testnet.walrus.space',
  WALRUS_AGGREGATOR: 'https://aggregator.walrus-testnet.walrus.space',
  DAPP_URL: 'http://localhost:3000',
};
```

### `/dapp/src/config.js`
```javascript
export const CONFIG = {
  NETWORK: 'testnet',
  PACKAGE_ID: '0x2cf73e2764bedfd840acd574a89ac4e3e34c77992a3565ed2da3853543dd9243',
  MODULE_NAME: 'marketplace',
  WALRUS_PUBLISHER: 'https://publisher.walrus-testnet.walrus.space',
  WALRUS_AGGREGATOR: 'https://aggregator.walrus-testnet.walrus.space',
};
```

## Setup Instructions

### 1. Deploy Smart Contract

```bash
cd move/mineshare
sui client publish --gas-budget 100000000
```

Update `PACKAGE_ID` in both config files with the deployed package address.

### 2. Build Extension

```bash
cd ui
pnpm install
pnpm run build
```

Load `ui/dist/` in Chrome as unpacked extension.

### 3. Run dApp

```bash
cd dapp
pnpm install
pnpm dev
```

dApp runs at `http://localhost:3000`

## Usage

### For Data Sellers:

1. **Install Extension**: Load the MineShare extension in Chrome
2. **Collect Data**: Browse normally with collection enabled
3. **Connect Wallet**: Click "Connect Wallet" in extension popup
4. **Export Data**: Click "Export Data to Marketplace"
   - Data is encrypted and uploaded to Walrus
   - Dataset NFT is minted to your wallet
5. **Create Listing**: Extension opens dApp automatically
   - Select your dataset
   - Set price and description
   - Create listing

### For Data Buyers:

1. **Open dApp**: Visit `http://localhost:3000`
2. **Connect Wallet**: Connect your Sui wallet
3. **Browse Listings**: View available datasets
4. **Purchase**: Click "Purchase" on desired listing
   - Pays in SUI
   - Automatically claims dataset to wallet
5. **Access Data**: Dataset NFT contains Walrus CID
   - Use CID to download from Walrus
   - Need seller's encryption key to decrypt

### For Sellers (Collecting Revenue):

1. **View My Listings**: Navigate to "My Listings" tab
2. **Check Balance**: See accumulated balance on sold listings
3. **Collect**: Click "Collect X SUI" button
4. **Receive**: SUI transferred to your wallet

## Security & Privacy

### Data Encryption
- Data is encrypted before uploading to Walrus
- Current implementation uses XOR encryption (demo)
- **Production**: Use AES-256-GCM encryption

### Encryption Key Management
- Keys stored locally in extension
- Buyers need seller's key to decrypt (shared off-chain)
- **Future**: Implement key escrow or encrypted key sharing

### Smart Contract Security
- Dataset ownership tracked via Sui objects
- Listings enforce payment before transfer
- Proceeds protected by seller-only withdrawal

## Troubleshooting

### Extension Issues

**Wallet not connecting:**
- Ensure Sui Wallet extension is installed
- Grant permissions when prompted

**Export fails:**
- Check that data has been collected
- Verify wallet has SUI for gas fees
- Check browser console for errors

### dApp Issues

**No datasets showing:**
- Ensure you've minted datasets via extension
- Check that wallet is connected
- Verify correct network (testnet/mainnet)

**Transaction failures:**
- Ensure sufficient SUI balance
- Check gas budget
- Verify object IDs are correct

**Listings not appearing:**
- Wait 5-10 seconds for blockchain indexing
- Refresh the page
- Check network connection

## Development

### Testing Locally

1. Start Sui local network:
```bash
sui start
```

2. Deploy contract to local network
3. Update configs to use `localnet`
4. Build extension and dApp

### Debugging

**Extension:**
- Open `chrome://extensions` → Extension details → Inspect views
- Check console logs in background page

**dApp:**
- Open browser DevTools
- Check Network tab for API calls
- View console for transaction errors

**Smart Contract:**
- Use `sui client call` to test functions
- View transaction effects: `sui client tx <digest>`

## Future Enhancements

### Extension
- [ ] Better encryption (AES-GCM)
- [ ] Data preview before export
- [ ] Export history and key management
- [ ] Batch operations

### dApp
- [ ] Search and filter listings
- [ ] Data preview for buyers
- [ ] Rating and reputation system
- [ ] Encrypted messaging between buyer/seller
- [ ] Key exchange mechanism

### Smart Contract
- [ ] Royalties on resales
- [ ] Escrow for key delivery
- [ ] Batch operations
- [ ] Upgradability

## License

MIT

## Support

For issues or questions:
- GitHub Issues: [repo link]
- Documentation: [docs link]
