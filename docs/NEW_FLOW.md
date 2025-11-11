# ✅ NEW Simplified Flow - Extension → dApp Integration

## Overview

The extension now **only collects and exports** data. All blockchain operations (wallet, Walrus upload, minting, listing) happen in the **dApp**.

---

## Complete User Flow

### 1️⃣ Extension: Collect Data (No Wallet Needed!)

```
┌─────────────────────────────┐
│  Browser Extension (UI)     │
│                              │
│  ✅ Collect browsing data    │
│  ✅ Aggregate data           │
│  ✅ Prepare for export       │
│  ✅ Store temporarily        │
│  ✅ Open dApp                │
│                              │
│  ❌ NO wallet connection     │
│  ❌ NO Walrus upload         │
│  ❌ NO minting               │
└─────────────────────────────┘
```

**User Actions:**
1. Browse websites normally (data collected automatically)
2. Click extension icon
3. Click "📤 Export to Marketplace"
4. Extension prepares data and opens dApp

**What Happens:**
- Data is aggregated from collected events
- Stored in `chrome.storage.local` under `pending_export`
- dApp opens with `?export=pending` URL parameter
- No wallet interaction required!

---

### 2️⃣ dApp: Complete the Listing (All Blockchain Operations)

```
┌─────────────────────────────┐
│  dApp (Marketplace)         │
│                              │
│  ✅ Connect wallet           │
│  ✅ Import extension data    │
│  ✅ Upload to Walrus         │
│  ✅ Mint Dataset NFT         │
│  ✅ Create listing           │
│  ✅ List on marketplace      │
└─────────────────────────────┘
```

**User Actions:**
1. dApp detects imported data from extension
2. User sees "📦 Data Ready to Mint" banner
3. Fill in title, description, price
4. Click "🚀 Mint & List Dataset"
5. Wallet prompts for:
   - Mint transaction (creates Dataset NFT)
   - Create listing transaction (lists for sale)

**What Happens:**
- Data encrypted and uploaded to Walrus
- Dataset NFT minted with Walrus CID
- Listing created with Dataset object
- Encryption key stored for buyer access

---

## Detailed Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    EXTENSION (No Blockchain)                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ User clicks "Export"
                              ▼
                    ┌──────────────────┐
                    │  Aggregate Data  │
                    │  • Per domain    │
                    │  • Keywords      │
                    │  • Time spent    │
                    └────────┬─────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ Store in              │
                │ chrome.storage.local: │
                │  pending_export       │
                │  export_timestamp     │
                └─────────┬──────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Open dApp with        │
              │ ?export=pending       │
              └───────────┬───────────┘
                          │
                          │
┌─────────────────────────▼─────────────────────────────────────────┐
│                         DAPP (All Blockchain)                     │
└───────────────────────────────────────────────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │ Detect URL parameter    │
            │ Check chrome.storage    │
            └──────────┬──────────────┘
                       │
                       ▼
            ┌─────────────────────────┐
            │ Import Data             │
            │ Show "Ready to Mint"    │
            └──────────┬──────────────┘
                       │
                       ▼
          ┌────────────────────────────┐
          │ User fills form:           │
          │ • Title                    │
          │ • Description              │
          │ • Price                    │
          └────────────┬───────────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │ Click "Mint & List Dataset"   │
       └───────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Step 1: Upload to Walrus         │
    │ • Encrypt data                   │
    │ • Upload to Walrus storage       │
    │ • Get blob ID (CID)              │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Step 2: Mint Dataset NFT         │
    │ • Call mint_dataset()            │
    │ • Pass CID + metadata            │
    │ • Dataset NFT created            │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Step 3: Create Listing           │
    │ • Call create_listing()          │
    │ • Pass Dataset ID + price        │
    │ • Listing object created         │
    └──────────────┬───────────────────┘
                   │
                   ▼
         ┌──────────────────────┐
         │ ✅ Listed on         │
         │ Marketplace!         │
         └──────────────────────┘
```

---

## Code Changes Summary

### Extension (`/ui/src/pages/PopupApp.jsx`)

**REMOVED:**
- ❌ Wallet connection state
- ❌ `checkWalletConnection()`
- ❌ `connectWallet()`
- ❌ Walrus upload call
- ❌ `mintDataset()` call
- ❌ Transaction handling

**ADDED:**
- ✅ Simple export to `chrome.storage.local`
- ✅ Opens dApp with `?export=pending` flag

### dApp (`/dapp/src/components/CreateListing.jsx`)

**ADDED:**
- ✅ `checkForPendingExport()` - Reads extension data
- ✅ `handleMintAndList()` - New flow for imported data
- ✅ Visual banner showing imported data stats
- ✅ Combined mint + list operation
- ✅ Encryption key storage

---

## Benefits of New Flow

### ✅ Better Separation of Concerns
- Extension = Data collection only
- dApp = Blockchain operations only

### ✅ Better UX
- Users don't need wallet in extension
- All transactions happen in one place (dApp)
- Clear visual feedback at each step

### ✅ Simpler Architecture
- No wallet API compatibility issues in extension
- Centralized blockchain logic in dApp
- Easier to maintain and debug

### ✅ More Secure
- Private keys only accessed in dApp context
- Extension never touches blockchain
- Reduced attack surface

---

## Testing the New Flow

### 1. Test Extension Export

```bash
1. Load extension in Chrome
2. Browse some websites
3. Click extension icon
4. Click "Export to Marketplace"
5. Verify:
   - No wallet prompt!
   - dApp opens automatically
   - Shows "?export=pending" in URL
```

### 2. Test dApp Import & Mint

```bash
1. dApp should show green banner: "📦 Data Ready to Mint"
2. Form pre-filled with data from extension
3. Fill in remaining details
4. Click "🚀 Mint & List Dataset"
5. Verify wallet prompts for:
   - Transaction 1: Mint dataset
   - Transaction 2: Create listing
6. Check marketplace for new listing
```

### 3. Verify Data Flow

```javascript
// In extension console (after export):
chrome.storage.local.get(['pending_export'], (d) => console.log(d));
// Should show aggregated data

// In dApp console (after import):
// Should log "Data imported from extension!"
```

---

## Troubleshooting

### Extension Issues

**Problem:** "No data collected yet"
- **Solution:** Browse some websites first with collection enabled

**Problem:** dApp doesn't open
- **Solution:** Check `CONFIG.DAPP_URL` in `/ui/src/config.js`

### dApp Issues

**Problem:** No green banner showing
- **Solution:** 
  - Check URL has `?export=pending`
  - Check extension storage has `pending_export`
  - Reload dApp page

**Problem:** Mint transaction fails
- **Solution:**
  - Check wallet has SUI for gas
  - Verify package ID is correct
  - Check network (testnet/mainnet)

**Problem:** "Could not access extension storage"
- **Solution:** This is normal if not coming from extension
  - Just use the "Select Existing Dataset" flow instead

---

## API Reference

### Extension Storage Keys

```javascript
// Set by extension when exporting
{
  pending_export: {
    summary: { totalDomains, totalEvents },
    domains: { /* per-domain stats */ },
    exportedAt: "ISO timestamp",
    version: "1.0"
  },
  export_timestamp: 1699634400000 // Unix timestamp
}
```

### dApp Functions

```javascript
// Check for pending export
checkForPendingExport()
  → Reads chrome.storage
  → Sets pendingExportData state
  → Pre-fills form

// Handle mint and list
handleMintAndList()
  → uploadToWalrus(data)
  → mintDataset(cid, metadata)
  → createListing(datasetId, price)
  → Store encryption key
  → Clear pending_export
```

---

## Next Steps

1. **Reload Extension:**
   ```bash
   chrome://extensions → Find MineShare → Click reload 🔄
   ```

2. **Start dApp:**
   ```bash
   cd dapp && pnpm dev
   ```

3. **Test Complete Flow:**
   - Extension: Export data
   - dApp: Mint & list
   - Verify listing appears

4. **Production:**
   - Update `CONFIG.DAPP_URL` to production URL
   - Deploy dApp
   - Publish extension

---

## Summary

✅ **Extension:** Just collect and export (NO wallet!)
✅ **dApp:** Handle all blockchain operations (wallet, Walrus, minting, listing)
✅ **Flow:** Extension → chrome.storage → dApp → Blockchain → Marketplace

This is now the **correct architecture** for your use case! 🎉
