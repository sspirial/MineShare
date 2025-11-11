# Deploy MineShare Smart Contract to Sui Testnet

## Prerequisites

1. **Sui CLI installed**
   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
   ```

2. **Sui wallet configured for testnet**
   ```bash
   sui client
   ```

3. **Testnet SUI tokens** (get from faucet)
   ```bash
   sui client faucet
   ```

## Deployment Steps

### 1. Navigate to Contract Directory
```bash
cd /home/munubi/MineShare/move/mineshare
```

### 2. Build the Contract
```bash
sui move build
```

This will compile the contract and show any errors.

### 3. Deploy to Testnet
```bash
sui client publish --gas-budget 100000000
```

**What this does:**
- Deploys the contract to Sui testnet
- Returns a PACKAGE_ID (this is what we need!)
- Costs some testnet SUI for gas

### 4. Save the Package ID

After deployment, you'll see output like:
```
----- Transaction Digest ----
<some-digest>

----- Published Package ----
PackageID: 0xABCDEF123456789...  ← THIS IS YOUR PACKAGE_ID
```

**COPY THIS PACKAGE_ID!**

### 5. Update Configuration Files

Update the `PACKAGE_ID` in these files:

#### File 1: `/home/munubi/MineShare/dapp/src/api/sui_api.js`
```javascript
export const PACKAGE_ID = '0xYOUR_NEW_PACKAGE_ID_HERE';
```

#### File 2: `/home/munubi/MineShare/dapp/src/config.js`
```javascript
PACKAGE_ID: '0xYOUR_NEW_PACKAGE_ID_HERE',
```

#### File 3: `/home/munubi/MineShare/ui/src/config.js`
```javascript
PACKAGE_ID: '0xYOUR_NEW_PACKAGE_ID_HERE',
```

#### File 4: `/home/munubi/MineShare/ui/src/api/sui_api.js`
```javascript
export const PACKAGE_ID = '0xYOUR_NEW_PACKAGE_ID_HERE';
```

### 6. Rebuild the Extension
```bash
cd /home/munubi/MineShare/ui
pnpm run build
```

Then reload the extension in Chrome.

### 7. Restart the dApp
The dApp will automatically pick up the new package ID.

## Quick Deploy Script

Save this as `deploy.sh` in the move/mineshare directory:

```bash
#!/bin/bash

echo "🔨 Building contract..."
sui move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🚀 Deploying to testnet..."
sui client publish --gas-budget 100000000 --json > deploy_output.json

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

# Extract package ID from JSON output
PACKAGE_ID=$(cat deploy_output.json | jq -r '.objectChanges[] | select(.type=="published") | .packageId')

echo ""
echo "✅ Deployment successful!"
echo "📦 Package ID: $PACKAGE_ID"
echo ""
echo "Update this Package ID in:"
echo "  - dapp/src/api/sui_api.js"
echo "  - dapp/src/config.js"
echo "  - ui/src/api/sui_api.js"
echo "  - ui/src/config.js"
echo ""
echo "Then rebuild:"
echo "  cd ui && pnpm run build"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Troubleshooting

### "Insufficient gas"
Get more testnet SUI:
```bash
sui client faucet
```

### "Active address not set"
Configure your wallet:
```bash
sui client active-address
sui client switch --address <your-address>
```

### "Build failed"
Check Move.toml dependencies:
```bash
cd move/mineshare
cat Move.toml
```

### Check Testnet Status
```bash
sui client envs
sui client active-env
```

Should show `testnet`.

## Alternative: Use Existing Deployed Contract

If someone has already deployed this contract, you can use their Package ID instead of deploying your own.

## Verification

After updating the Package ID, verify it works:

1. Open dApp
2. Connect wallet
3. Try creating a listing
4. Should no longer see "Dependent package not found" error

## Notes

- Package IDs are permanent once deployed
- You can't "update" a package, you must publish a new version
- Each deployment creates a new Package ID
- Testnet can be reset, requiring redeployment
- Keep your Package ID documented!
