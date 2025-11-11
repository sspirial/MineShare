# Transaction API Fix - "Cannot read properties of undefined (reading 'toJSON')"

## Problem
Error when clicking "Mint & List Dataset":
```
❌ Failed: Cannot read properties of undefined (reading 'toJSON')
```

## Root Cause
The code was using the **old Sui Wallet Standard API** format instead of the new **@mysten/dapp-kit API**.

### Old Format (Incorrect):
```javascript
await walletApi.signAndExecuteTransactionBlock({
  transactionBlock: tx,
  options: { ... }
});
```

### New Format (Correct):
```javascript
await signAndExecuteTransaction({
  transaction: tx,  // Note: 'transaction' not 'transactionBlock'
  options: { ... }
});
```

## Changes Made

### 1. Updated `sui_api.js` Functions

#### `mintDataset()`:
- Changed parameter from `walletApi` object to `signAndExecuteTransaction` function
- Updated to call function directly instead of `walletApi.signAndExecuteTransactionBlock()`
- Changed `transactionBlock` → `transaction`
- Added better error logging

#### `createListing()`:
- Same changes as `mintDataset()`
- Now properly extracts `listingId` from result

### 2. Updated `CreateListing.jsx` Component

Changed function calls from:
```javascript
await mintDataset(cidBytes, metadata, {
  signAndExecuteTransactionBlock: signAndExecuteTransaction
});
```

To:
```javascript
await mintDataset(cidBytes, metadata, signAndExecuteTransaction);
```

## API Differences

### @mysten/dapp-kit (Current - Correct ✅)
```javascript
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

const result = await signAndExecuteTransaction({
  transaction: tx,
  options: {
    showEffects: true,
    showObjectChanges: true,
  }
});
```

### Wallet Standard (Old - Incorrect ❌)
```javascript
const wallet = useWallet(); // Old approach

const result = await wallet.signAndExecuteTransactionBlock({
  transactionBlock: tx,
  options: { ... }
});
```

## Testing the Fix

1. **Open dApp**: `http://localhost:3000?export=pending`
2. **Verify data loaded**: Should see green "Data Ready to Mint" box
3. **Fill form**: Title, description already pre-filled
4. **Click "Mint & List"**: Should now work without toJSON error
5. **Watch console**: Should see proper transaction logs
6. **Connect wallet**: Approve transaction when prompted
7. **Success**: Should mint NFT and create listing

## Expected Console Output

```
Uploading to Walrus...
⚠️ Using MOCK mode for Walrus - data not actually uploaded!
Mint transaction result: {digest: "...", effects: {...}, objectChanges: [...]}
Create listing result: {digest: "...", effects: {...}, objectChanges: [...]}
✅ Success! Dataset minted and listed on marketplace!
```

## Other Functions Updated

The following functions also need to be updated if you use them:

- `buyListing()` - Uses wallet for coin management
- `claimDataset()` - Uses wallet
- `collectProceeds()` - Uses wallet

These will need similar updates when implemented in the dApp UI.

## Files Modified

1. `/home/munubi/MineShare/dapp/src/api/sui_api.js`
   - `mintDataset()` function signature and implementation
   - `createListing()` function signature and implementation

2. `/home/munubi/MineShare/dapp/src/components/CreateListing.jsx`
   - `handleMintAndList()` - Fixed function calls
   - `handleSubmit()` - Fixed function calls

## Debugging Tips

If you still see errors:

### Check wallet connection:
```javascript
console.log('Current account:', currentAccount);
console.log('Sign function:', signAndExecuteTransaction);
```

### Check transaction object:
```javascript
console.log('Transaction:', tx);
console.log('Transaction JSON:', tx.getData());
```

### Check result structure:
```javascript
console.log('Full result:', result);
console.log('Object changes:', result.objectChanges);
console.log('Effects:', result.effects);
```

## Related Documentation

- [Sui dApp Kit Docs](https://sdk.mystenlabs.com/dapp-kit)
- [Transaction Building](https://sdk.mystenlabs.com/typescript/transaction-building)
- [Sign and Execute](https://sdk.mystenlabs.com/dapp-kit/hooks/useSignAndExecuteTransaction)

## Next Steps

1. ✅ Test minting with mock Walrus storage
2. 🔄 Once Walrus testnet is working, disable MOCK_MODE
3. 🧪 Test with real Walrus storage
4. 🎨 Add loading states and better error messages
5. 📱 Test on different wallets (Sui Wallet, Suiet, Ethos)
