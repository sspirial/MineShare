# Quick Reference: New UI Structure

## Where Everything Is Now

### Frontend/UI Code → `ui/` folder
```
ui/
├── components/          # Reusable React components
│   ├── Header.jsx
│   ├── ListingCard.jsx
│   ├── Modal.jsx
│   ├── SplashScreen.jsx
│   ├── StatusMessage.jsx
│   └── WalletConnect.jsx
│
├── pages/              # Page-level components
│   ├── PopupApp.jsx          # Main popup application
│   ├── OptionsApp.jsx        # Main options application
│   ├── popup-main.jsx        # Popup entry point
│   ├── options-main.jsx      # Options entry point
│   ├── popup-new.html        # Popup HTML
│   └── options-new.html      # Options HTML
│
├── styles/             # Global styles
│   └── styles.css
│
└── assets/             # UI assets (copy of main assets)
```

### Backend/Core Code → `src/` folder
```
src/
├── api/                # Business logic & APIs
│   ├── marketplace.js
│   ├── walrus.js
│   └── data_api.js
│
├── types/              # TypeScript definitions
│   └── types.d.ts
│
├── background.js       # Service worker
└── content_script.js   # Content script
```

## Import Examples

### In ui/pages/PopupApp.jsx
```javascript
import Header from '../components/Header';
import Modal from '../components/Modal';
import SplashScreen from '../components/SplashScreen';
```

### In ui/pages/popup-main.jsx
```javascript
import PopupApp from './PopupApp';
import '../styles/styles.css';
```

### In ui/pages/popup-new.html
```html
<script type="module" src="../../src/api/walrus.js"></script>
<script type="module" src="../../src/api/marketplace.js"></script>
<script type="module" src="./popup-main.jsx"></script>
```

## Build & Test

```bash
# Build the extension
pnpm run build

# Watch for changes
pnpm run build:watch

# Clean build
pnpm run clean && pnpm run build
```

## Key Changes Summary

| Old Path | New Path | Type |
|----------|----------|------|
| `src/ui/PopupApp.jsx` | `ui/pages/PopupApp.jsx` | Page |
| `src/ui/OptionsApp.jsx` | `ui/pages/OptionsApp.jsx` | Page |
| `src/ui/components/Header.jsx` | `ui/components/Header.jsx` | Component |
| `src/components/SplashScreen.jsx` | `ui/components/SplashScreen.jsx` | Component |
| `src/ui/styles.css` | `ui/styles/styles.css` | Style |

## Tips

✅ **Frontend work?** → Look in `ui/`
✅ **Backend/API work?** → Look in `src/`
✅ **Adding component?** → Create in `ui/components/`
✅ **Adding page?** → Create in `ui/pages/`
✅ **Need API?** → Check `src/api/`

## Status
✅ All files moved successfully
✅ All imports updated correctly
✅ Build passes with no errors
✅ Documentation updated
