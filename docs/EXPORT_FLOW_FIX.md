# Export Flow Fix - Extension to dApp Communication

## Problem
The dApp couldn't access `chrome.storage` API because it runs as a regular webpage, not in an extension context. This prevented the export data from reaching the dApp.

## Solution
Changed the communication mechanism to use `localStorage` which is accessible from both contexts:

### Flow Architecture
```
Extension Popup
    ↓ (stores data in chrome.storage)
Background Script
    ↓ (opens new tab with ?export=pending)
Content Script (injected in dApp page)
    ↓ (reads from chrome.storage)
    ↓ (writes to localStorage)
dApp React Component
    ↓ (reads from localStorage)
✅ Data available!
```

## Changes Made

### 1. Extension Popup (`ui/src/pages/PopupApp.jsx`)
- Store export data with tab-specific key when creating new tab
- This ensures the right tab gets the right data

### 2. Background Script (`ui/src/background.js`)
- Added `get_pending_export` message handler
- Checks tab-specific storage first, then falls back to general storage
- Validates data age (5 minutes max)
- Added comprehensive logging

### 3. Content Script (`ui/src/content_script.js`)
- Detects `?export=pending` URL parameter
- Requests data from background script
- Injects data into `localStorage` (accessible to dApp)
- Dispatches custom event `mineshare_data_ready`
- Added detailed logging

### 4. dApp Component (`dapp/src/components/CreateListing.jsx`)
- Reads from `localStorage` instead of `chrome.storage`
- Listens for `mineshare_data_ready` event
- Validates timestamp and data structure
- Pre-fills form with exported data
- Added extensive console logging

## Testing Steps

### 1. Rebuild the Extension
```bash
cd ui
pnpm install
pnpm run build
```

### 2. Reload Extension in Chrome
- Go to `chrome://extensions/`
- Click "Reload" on MineShare extension

### 3. Start the dApp
```bash
cd dapp
pnpm install
pnpm run dev
```

### 4. Test the Flow
1. **Collect some data**: Browse a few websites with the extension enabled
2. **Open extension popup**: Click the MineShare icon
3. **Click "Export to Marketplace"**
4. **Check browser console** (F12) for logs:
   - `[MineShare Content Script]` - Shows data injection
   - `[MineShare Background]` - Shows data retrieval
   - `Checking for pending export...` - Shows dApp receiving data

### 5. Expected Behavior
- ✅ Green box appears: "📦 Data Ready to Mint"
- ✅ Shows: "X domains • Y events"
- ✅ Form pre-filled with title and description
- ✅ "Mint & List Dataset" button visible
- ✅ No "Select Existing Dataset" dropdown

## Debug Checklist

If it doesn't work, check console for:

1. **Content Script logs**: Should see "Export pending detected"
2. **Background Script logs**: Should see "Found pending export"
3. **localStorage**: Open DevTools → Application → Local Storage → check for:
   - `mineshare_pending_export`
   - `mineshare_export_timestamp`
4. **URL**: Should have `?export=pending` parameter
5. **Data structure**: Export data should have:
   ```json
   {
     "summary": {
       "totalDomains": 10,
       "totalEvents": 150
     },
     "domains": {...},
     "exportedAt": "2025-11-11T..."
   }
   ```

## Key localStorage Items

- `mineshare_pending_export`: The actual export data (JSON string)
- `mineshare_export_timestamp`: Timestamp in milliseconds
- Validity: 5 minutes after creation

## Cleanup

Data is automatically cleaned up after:
- Successful mint and list
- Expiration (5 minutes)
- Manual removal via localStorage.clear()

## Common Issues

### Issue: "Waiting for data from extension..."
- Content script might not be running
- Check if extension is loaded properly
- Verify `?export=pending` is in URL

### Issue: "Export data expired"
- Took more than 5 minutes from export to page load
- Solution: Export again from extension

### Issue: No green box appears
- Check console for errors
- Verify `pendingExportData` state is set
- Check if `exportData.summary` exists

## Production Deployment

Remember to update in `ui/src/config.js`:
```javascript
DAPP_URL: 'https://your-production-domain.com'
```
