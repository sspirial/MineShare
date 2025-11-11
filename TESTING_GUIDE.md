# Testing Guide - Export Flow

## Quick Start

### 1. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Reload" on the MineShare extension (or "Load unpacked" if not loaded)
4. Point to: `/home/munubi/MineShare/ui/dist`

### 2. Start the dApp
```bash
cd /home/munubi/MineShare/dapp
pnpm run dev
```
Should start on `http://localhost:3000`

### 3. Collect Some Test Data
1. Browse to a few websites (e.g., news sites, GitHub, YouTube)
2. Click around and scroll on pages
3. Visit at least 3-5 different domains

### 4. Export to Marketplace
1. Click the MineShare extension icon (top right in Chrome)
2. Wait for it to show collected data
3. Click **"📤 Export to Marketplace"** button
4. A new tab should open with: `http://localhost:3000?export=pending`

### 5. Verify the Flow

#### ✅ Success Indicators:
- [ ] Browser console shows: `[MineShare Content Script] Export pending detected`
- [ ] Browser console shows: `[MineShare Background] Found pending export`
- [ ] Green box appears at top of form: "📦 Data Ready to Mint"
- [ ] Shows domain and event counts
- [ ] Title field pre-filled: "Browsing Data - 11/11/2025"
- [ ] Description pre-filled: "X domains, Y events"
- [ ] Button text is: "🚀 Mint & List Dataset" (not "Create Listing")

#### 🔍 Debug View:
Open Browser DevTools (F12) and check:

**Console Tab:**
```
[MineShare Content Script] URL params: export=pending
[MineShare Content Script] Export pending detected
[MineShare Background] Found pending export
[MineShare Content Script] ✅ Export data ready
Checking for pending export...
✅ Successfully loaded pending export data
```

**Application Tab → Local Storage → `http://localhost:3000`:**
- `mineshare_pending_export`: (Large JSON string)
- `mineshare_export_timestamp`: (Timestamp number)

### 6. Complete the Listing
1. Review/edit the title and description
2. Set the price (e.g., 0.1 SUI)
3. Click "🚀 Mint & List Dataset"
4. Connect your Sui wallet if prompted
5. Confirm the transaction

### 7. Expected Result
- Data uploads to Walrus
- NFT minted on Sui blockchain
- Listed on marketplace
- Success message appears
- Form resets
- localStorage cleaned up

---

## Troubleshooting

### Problem: "Waiting for data from extension..."

**Cause**: Content script didn't receive data from background

**Solutions**:
1. Check extension is loaded: `chrome://extensions/`
2. Verify console shows background script logs
3. Try exporting again from extension
4. Check `chrome.storage` in extension popup:
   ```javascript
   // In extension popup console:
   chrome.storage.local.get(['pending_export'], (d) => console.log(d))
   ```

### Problem: "No datasets available"

**Cause**: You're seeing the old flow (selecting existing datasets)

**Solutions**:
1. Make sure URL has `?export=pending`
2. Check localStorage has the data
3. Verify `pendingExportData` state in React DevTools
4. Look for errors in console

### Problem: "Export data expired"

**Cause**: More than 5 minutes passed

**Solutions**:
1. Go back to extension and export again
2. Data is only valid for 5 minutes for security

### Problem: Form shows "Select Existing Dataset"

**Cause**: `pendingExportData` is null or undefined

**Solutions**:
1. Check console logs for data loading
2. Verify localStorage structure
3. Check if data has valid `summary` field:
   ```javascript
   // In dApp console:
   const data = JSON.parse(localStorage.getItem('mineshare_pending_export'))
   console.log(data.summary)
   ```

---

## Manual Testing Commands

### Check Extension Storage:
```javascript
// In extension popup console (click on extension icon first):
chrome.storage.local.get(null, (items) => {
  console.log('All storage:', items);
  console.log('Events count:', items.activity_events_v1?.length);
  console.log('Pending export:', items.pending_export);
});
```

### Check dApp localStorage:
```javascript
// In dApp console (F12 on localhost:3000):
console.log('Pending export:', 
  JSON.parse(localStorage.getItem('mineshare_pending_export'))
);
console.log('Timestamp:', 
  localStorage.getItem('mineshare_export_timestamp')
);
```

### Clear Test Data:
```javascript
// Extension:
chrome.storage.local.clear(() => console.log('Extension storage cleared'));

// dApp:
localStorage.clear();
console.log('dApp localStorage cleared');
```

---

## Expected Console Output

### Extension Popup (when clicking Export):
```
Preparing data for export...
Data prepared! Opening marketplace...
```

### Extension Background:
```
[MineShare Background] get_pending_export request from tab: 123
[MineShare Background] Checking for tab-specific export: pending_export_tab_123
[MineShare Background] ✅ Found tab-specific export data
```

### Content Script (in dApp tab):
```
[MineShare Content Script] URL params: export=pending
[MineShare Content Script] Export pending detected, requesting data from background...
[MineShare Content Script] Response from background: {ok: true, data: {...}}
[MineShare Content Script] Injecting data into localStorage
[MineShare Content Script] Data injected, dispatching event
[MineShare Content Script] ✅ Export data ready
```

### dApp (React):
```
Checking for pending export...
URL params: export=pending
Export pending flag detected
localStorage check: {hasData: true, hasTimestamp: true, dataLength: 2547}
Parsed export data: {exportedAt: "2025-11-11...", totalDomains: 5, totalEvents: 142}
✅ Successfully loaded pending export data
MineShare data ready event received: {domains: 5, events: 142}
```

---

## Data Flow Diagram

```
┌─────────────────┐
│ Extension Popup │
│  (User clicks   │
│   "Export")     │
└────────┬────────┘
         │ 1. Aggregate data
         │ 2. Store in chrome.storage
         │ 3. Open new tab
         ↓
┌─────────────────────────┐
│ Background Script       │
│ chrome.storage:         │
│ - pending_export        │
│ - pending_export_tab_X  │
└────────┬────────────────┘
         │ 4. New tab opens
         │    ?export=pending
         ↓
┌─────────────────────────┐
│ Content Script          │
│ (Injected in dApp)      │
└────────┬────────────────┘
         │ 5. Detect URL param
         │ 6. Request data
         │ 7. Write to localStorage
         │ 8. Dispatch event
         ↓
┌─────────────────────────┐
│ dApp (React)            │
│ localStorage:           │
│ - mineshare_pending_... │
└────────┬────────────────┘
         │ 9. Read from localStorage
         │ 10. Display in UI
         ↓
┌─────────────────────────┐
│ User fills form         │
│ Clicks "Mint & List"    │
└─────────────────────────┘
```
