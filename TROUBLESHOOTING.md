# MineShare Extension Troubleshooting

## Extension Not Rendering / Blank Popup

### Problem
Extension popup shows blank/empty screen.

### Solutions

1. **Reload the Extension**
   - Go to `chrome://extensions`
   - Find MineShare
   - Click the refresh/reload icon
   - Try opening popup again

2. **Check Console for Errors**
   - Right-click extension icon → "Inspect popup"
   - Check Console tab for errors
   - Common issues:
     - Import errors (module not found)
     - Syntax errors
     - API compatibility issues

3. **Rebuild Extension**
   ```bash
   cd ui
   pnpm run build
   ```
   - Then reload extension in Chrome

4. **Clear Extension Storage**
   - Open extension popup (even if blank)
   - Right-click → Inspect
   - Console tab, run:
   ```javascript
   chrome.storage.local.clear()
   ```
   - Reload extension

## Wallet Connection Issues

### Problem
"Connect Wallet" button doesn't work or wallet not detected.

### Solutions

1. **Install Sui Wallet**
   - Install from Chrome Web Store
   - Create/import wallet
   - Refresh page

2. **Grant Permissions**
   - When clicking "Connect Wallet"
   - Wallet popup should appear
   - Click "Connect" to grant permissions

3. **Check Wallet API**
   - In extension console:
   ```javascript
   window.suiWallet
   ```
   - Should show wallet object

## Export to Marketplace Fails

### Problem
Export button doesn't work or shows errors.

### Common Causes & Fixes

1. **No Data Collected**
   - Error: "No data collected yet"
   - Solution: Browse some websites first with collection enabled

2. **Wallet Not Connected**
   - Error: "Please connect your Sui wallet first"
   - Solution: Click "Connect Wallet" button

3. **Insufficient Gas**
   - Error: Transaction fails
   - Solution: Get testnet SUI from faucet:
     ```bash
     sui client faucet
     ```

4. **Walrus Upload Fails**
   - Error: "Walrus upload failed"
   - Solution: Check network connection, Walrus endpoints might be down

5. **Wrong Package ID**
   - Error: "Module not found" or "Function not found"
   - Solution: Update `PACKAGE_ID` in `ui/src/config.js`

## Build Errors

### Problem
`pnpm run build` fails

### Solutions

1. **Clear Node Modules**
   ```bash
   cd ui
   rm -rf node_modules dist
   pnpm install
   pnpm run build
   ```

2. **Check Dependencies**
   ```bash
   pnpm install
   ```

3. **Check for Syntax Errors**
   - Look at error message
   - Fix the file mentioned
   - Rebuild

## Data Not Collecting

### Problem
No events showing in extension.

### Solutions

1. **Enable Collection**
   - Extension popup → Check "Enable data collection"
   - Click "Save Settings"

2. **Enable Categories**
   - Make sure at least some categories are checked
   - Click "Save Settings"

3. **Check Background Script**
   - Go to `chrome://extensions`
   - Find MineShare → "Inspect views: background page"
   - Check for errors in Console

4. **Check Content Script**
   - Open any webpage
   - Right-click → Inspect
   - Console tab → Look for MineShare logs

## API Errors

### Sui Transaction Fails

**Error:** "Transaction failed: [error message]"

**Solutions:**
- Check gas balance: `sui client gas`
- Verify package ID is correct
- Check network (testnet/mainnet)
- Increase gas budget

### Walrus Connection Fails

**Error:** "Walrus upload/download failed"

**Solutions:**
- Check network connection
- Verify Walrus endpoints in config:
  - Publisher: `https://publisher.walrus-testnet.walrus.space`
  - Aggregator: `https://aggregator.walrus-testnet.walrus.space`
- Try again (Walrus testnet can be slow)

## Development Tips

### Hot Reload Not Working
- Vite watch mode: `pnpm run build:watch`
- Manually reload extension in Chrome after changes

### Testing Without Blockchain
- Comment out blockchain calls temporarily
- Use mock data for testing UI
- Test data collection independently

### Debug Extension
```javascript
// In extension console:

// Check storage
chrome.storage.local.get(null, (data) => console.log(data));

// Check specific keys
chrome.storage.local.get(['activity_events_v1'], (d) => console.log(d));

// Clear storage
chrome.storage.local.clear(() => console.log('Cleared'));

// Check wallet
console.log(window.suiWallet);
```

## Getting Help

### Information to Provide

When reporting issues, include:

1. **Error Message** (exact text from console)
2. **Browser Console Log** (screenshot or copy/paste)
3. **Steps to Reproduce**
4. **Extension Version** (from manifest.json)
5. **Chrome Version** (`chrome://version`)
6. **Network** (testnet/mainnet)

### Common Commands

```bash
# Rebuild extension
cd ui && pnpm run build

# Check Sui client
sui client active-address
sui client gas

# Get testnet tokens
sui client faucet

# Check package
sui client object <PACKAGE_ID>

# View transaction
sui client tx <TX_DIGEST>
```

## Prevention

### Before Each Session

1. Check wallet is connected and funded
2. Verify extension is loaded and active
3. Check data collection is enabled
4. Test with small dataset first

### After Updates

1. Rebuild extension: `pnpm run build`
2. Reload extension in Chrome
3. Clear extension storage if needed
4. Test all features

---

## Still Having Issues?

1. Check `INTEGRATION.md` for detailed setup
2. Review `QUICKSTART.md` for basic setup
3. Check browser console for specific errors
4. Try in incognito mode (fresh state)
5. Reinstall extension from scratch
