# 🚀 MineShare Quick Start Guide

## What You'll Build

A complete decentralized data marketplace where:
- **Extension**: Collects & exports browsing data
- **Smart Contract**: Manages ownership & transactions
- **dApp**: Marketplace for buying/selling data

---

## ⚡ Quick Setup (5 minutes)

### Prerequisites
- Node.js 18+ and pnpm
- Sui CLI installed
- Chrome browser
- Sui Wallet extension

### 1. Deploy Smart Contract

```bash
cd move/mineshare
sui client publish --gas-budget 100000000
```

Copy the **Package ID** from output (looks like `0x2cf73...`).

### 2. Update Configs

**File: `ui/src/config.js`**
```javascript
PACKAGE_ID: '0xYOUR_PACKAGE_ID_HERE',
```

**File: `dapp/src/config.js`**
```javascript
PACKAGE_ID: '0xYOUR_PACKAGE_ID_HERE',
```

### 3. Build & Load Extension

```bash
cd ui
pnpm install
pnpm run build
```

Then:
1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `ui/dist/` folder

### 4. Run dApp

```bash
cd dapp
pnpm install
pnpm dev
```

Open `http://localhost:3000`

---

## 🎯 How to Use

### As a Data Seller

1. **Collect Data**
   - Browse websites with extension active
   - Extension collects browsing patterns

2. **Export to Marketplace**
   - Click extension icon
   - Click "Connect Wallet" (first time)
   - Click "Export Data to Marketplace"
   - Wait for upload + minting (~30 seconds)

3. **Create Listing**
   - dApp opens automatically
   - Select your dataset from dropdown
   - Set price in SUI
   - Add title and description
   - Click "Create Listing"

4. **Collect Proceeds** (after sale)
   - Go to "My Listings" tab
   - Click "Collect X SUI" on sold items
   - SUI sent to your wallet

### As a Data Buyer

1. **Browse Marketplace**
   - Open dApp at `http://localhost:3000`
   - Click "Connect Wallet"
   - Browse listings in "Browse Listings" tab

2. **Purchase Dataset**
   - Click "Purchase" on desired listing
   - Confirm transaction in wallet
   - Dataset automatically claimed

3. **Access Data**
   - Dataset NFT now in your wallet
   - Contains Walrus CID for downloading
   - Need encryption key from seller

---

## 📋 Function Reference

### Extension Functions
- **mint_dataset**: Creates Dataset NFT from collected data

### dApp Functions
- **create_listing**: Lists dataset for sale
- **buy_listing**: Purchases a listing
- **claim_dataset**: Claims purchased dataset
- **collect_proceeds**: Withdraws sales revenue

---

## 🔧 Common Issues

### "No datasets found"
→ Export data from extension first

### "Transaction failed"
→ Check SUI balance for gas fees

### "Wallet not connecting"
→ Install Sui Wallet extension

### "Listings not showing"
→ Wait 10 seconds, then refresh

---

## 📊 Architecture

```
Extension → Walrus → Smart Contract ← dApp
    │         │            │           │
    │         │            │           │
  Collect   Store       Manage      Trade
   Data     Data       Ownership   Listings
```

---

## 🔐 Security Notes

**Current Implementation (Demo):**
- XOR encryption (for demonstration)
- Keys stored locally
- Manual key sharing

**Production Ready:**
- Use AES-256-GCM encryption
- Implement key escrow system
- Add encrypted messaging
- Enable automated key delivery

---

## 📚 Full Documentation

See `INTEGRATION.md` for:
- Complete architecture details
- API reference
- Development guide
- Troubleshooting
- Future enhancements

---

## 🎉 You're Ready!

Your MineShare marketplace is now operational. Start collecting data and creating listings!

**Questions?** Check `INTEGRATION.md` or open an issue.
