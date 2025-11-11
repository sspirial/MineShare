# Walrus Upload Issue - 404 Error

## Problem
The Walrus testnet publisher is returning a 404 error when trying to upload data:
```
Failed to load resource: the server responded with a status of 404 ()
URL: https://publisher.walrus-tes.us.space/v1/store:1
```

## Possible Causes

### 1. Walrus Testnet Availability
The Walrus testnet may be temporarily unavailable or undergoing maintenance. The 404 error suggests the endpoint doesn't exist or has been changed.

### 2. API Version Change
The Walrus API might have been updated. The current code uses `/v1/store`, but this may have changed.

### 3. Authentication Required
Some Walrus publisher nodes may require authentication or specific headers that aren't being sent.

### 4. CORS Issues
Cross-origin requests from the browser may be blocked by the Walrus publisher.

## Solutions Implemented

### Temporary: Mock Mode ✅
I've enabled **MOCK_MODE** in `dapp/src/api/walrus_api.js` to allow testing the full flow without Walrus:

```javascript
const MOCK_MODE = true; // Currently enabled for testing
```

**How it works:**
- Generates a mock blob ID: `mock_[32-char-hex]`
- Stores encrypted data in browser's localStorage
- Allows you to test minting, listing, and the full marketplace flow
- Data persists in browser until localStorage is cleared

**Limitations:**
- Data only available in your browser (not decentralized)
- Data lost if you clear browser data
- Can't share data with other users
- Not suitable for production

### Permanent Solutions (Choose One)

#### Option 1: Use Walrus CLI Client (Recommended for Development)
Install and run a local Walrus client:

```bash
# Install Walrus CLI
cargo install walrus-cli

# Run local publisher
walrus publisher --network testnet

# Update code to use local endpoint
const WALRUS_PUBLISHER = 'http://localhost:31415';
```

#### Option 2: Try Alternative Walrus Endpoints
Check the official docs for alternative publisher nodes:
- https://docs.walrus.site
- https://github.com/MystenLabs/walrus-docs

Update in `walrus_api.js`:
```javascript
const WALRUS_PUBLISHER = 'https://[alternative-publisher-url]';
```

#### Option 3: Wait for Testnet Restoration
The testnet might come back online. Monitor:
- Walrus Discord
- Sui Discord #walrus channel
- Walrus GitHub issues

#### Option 4: Use Walrus Mainnet
If you have mainnet SUI tokens:
```javascript
const WALRUS_PUBLISHER = 'https://publisher.walrus.space';
const WALRUS_AGGREGATOR = 'https://aggregator.walrus.space';
const MOCK_MODE = false;
```

**Note:** Mainnet storage costs real SUI tokens.

#### Option 5: Implement Fallback Storage
Add support for alternative storage backends:
- IPFS (via Infura, Pinata, or web3.storage)
- Arweave
- Filecoin
- AWS S3 (centralized but reliable)

## Current Configuration

### Mock Mode Enabled ✅
File: `dapp/src/api/walrus_api.js`

```javascript
const MOCK_MODE = true; // Enabled for testing
```

### What Works with Mock Mode:
1. ✅ Export data from extension
2. ✅ Data arrives in dApp
3. ✅ Form pre-fills correctly
4. ✅ "Upload to Walrus" (mocks the upload)
5. ✅ Generate mock blob ID
6. ✅ Mint dataset NFT on Sui
7. ✅ Create marketplace listing
8. ✅ View listings on marketplace
9. ⚠️ Download/decrypt (only works in same browser)

### What Doesn't Work:
- ❌ Actual decentralized storage
- ❌ Sharing data with other users
- ❌ Data persistence across browsers
- ❌ True censorship resistance

## Testing the Flow with Mock Mode

1. **Enable Mock Mode** (already done ✅)
   ```javascript
   const MOCK_MODE = true;
   ```

2. **Export from Extension**
   - Click extension icon
   - Click "Export to Marketplace"

3. **Mint & List**
   - Fill in form details
   - Click "🚀 Mint & List Dataset"
   - Connect Sui wallet
   - Confirm transaction

4. **Verify in Console**
   You should see:
   ```
   ⚠️ Using MOCK mode for Walrus - data not actually uploaded!
   ```

5. **Check localStorage**
   ```javascript
   // In browser console
   Object.keys(localStorage).filter(k => k.startsWith('walrus_mock_'))
   ```

## Checking Walrus Testnet Status

### Test the endpoint manually:
```bash
# Test if publisher is reachable
curl -I https://publisher.walrus-testnet.walrus.space/v1/store

# Expected if working: 405 Method Not Allowed (because we're using GET)
# Current issue: 404 Not Found
```

### Try uploading a test file:
```bash
# Create test file
echo "test data" > test.txt

# Try upload
curl -X PUT \
  "https://publisher.walrus-testnet.walrus.space/v1/store?epochs=5" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @test.txt
```

## When to Disable Mock Mode

Disable mock mode when:
1. Walrus testnet is confirmed working
2. You've set up a local Walrus client
3. You've switched to mainnet
4. You've implemented alternative storage

```javascript
const MOCK_MODE = false; // Disable mock mode
```

## Error Logs to Share with Walrus Team

If reporting this issue, include:
```
Error: Walrus upload failed: 404 Not Found
URL: https://publisher.walrus-testnet.walrus.space/v1/store?epochs=5
Method: PUT
Headers: Content-Type: application/octet-stream
Body: Binary data (encrypted)
```

## Next Steps

1. ✅ **Test with Mock Mode** - Complete the full flow to verify everything else works
2. 🔍 **Check Walrus Docs** - Look for updated endpoints or API changes
3. 💬 **Ask in Discord** - Sui/Walrus community might have answers
4. 🔄 **Try Alternative Publisher** - Test with different Walrus nodes
5. 🚀 **Consider Mainnet** - If testnet remains unavailable

## Additional Resources

- **Walrus Docs**: https://docs.walrus.site
- **Sui Docs**: https://docs.sui.io
- **Walrus GitHub**: https://github.com/MystenLabs/walrus
- **Sui Discord**: https://discord.gg/sui
- **Status Page**: Check if Walrus has a status page for testnet uptime
