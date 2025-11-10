# MineShare - Project Structure (React)

This document describes the organized directory structure of the MineShare Chrome extension built with React.

## 📁 Directory Layout

```
MineShare/
│
├── 📄 manifest.json              # Extension manifest (entry point)
├── 📄 README.md                  # Project documentation
├── 📄 REACT_MIGRATION.md         # React migration documentation
├── 📄 .gitignore                 # Git ignore rules
├── 📄 package.json               # Dependencies and scripts
├── 📄 pnpm-lock.yaml            # pnpm lock file
├── 📄 vite.config.js            # Vite build configuration
├── 📄 build-extension.js         # Post-build script
│
├── 📂 src/                       # Backend/Core code
│   ├── 📄 background.js          # Service worker (data collection)
│   ├── 📄 content_script.js      # Page interaction tracker
│   │
│   ├── 📂 api/                   # API & business logic
│   │   ├── 📄 marketplace.js     # Marketplace API
│   │   ├── 📄 walrus.js          # Walrus blockchain API
│   │   └── 📄 data_api.js        # Data aggregation helper
│   │
│   └── 📂 types/                 # TypeScript definitions
│       └── 📄 types.d.ts         # Type definitions
│
├── 📂 ui/                        # Frontend/UI (React)
│   ├── 📂 components/            # Reusable React components
│   │   ├── 📄 Header.jsx         # Header component
│   │   ├── 📄 Modal.jsx          # Modal dialog
│   │   ├── 📄 ListingCard.jsx    # Listing card
│   │   ├── 📄 StatusMessage.jsx  # Status messages
│   │   ├── 📄 SplashScreen.jsx   # Welcome splash screen
│   │   ├── 📄 SplashScreen.css   # Splash screen styles
│   │   ├── 📄 WalletConnect.jsx  # Wallet connection component
│   │   └── 📄 WalletConnect.css  # Wallet connect styles
│   │
│   ├── 📂 pages/                 # Page-level components
│   │   ├── 📄 PopupApp.jsx       # Popup React application
│   │   ├── 📄 OptionsApp.jsx     # Options React application
│   │   ├── 📄 popup-main.jsx     # Popup entry point
│   │   ├── 📄 options-main.jsx   # Options entry point
│   │   ├── 📄 popup-new.html     # Popup HTML template
│   │   └── 📄 options-new.html   # Options HTML template
│   │
│   ├── � styles/                # Global styles
│   │   └── � styles.css         # Global CSS
│   │
│   └── � assets/                # UI-specific assets (copy of main assets)
│       ├── 📂 icons/             # Extension icons
│       └── � styles/            # Additional stylesheets
│
├── 📂 assets/                    # Static assets (original)
│   ├── 📂 icons/                 # Extension icons
│   │   ├── 📂 new icons/         # New brand icons
│   │   ├── 🖼️ icon16.png         # 16x16 toolbar icon
│   │   ├── 🖼️ icon48.png         # 48x48 management icon
│   │   └── 🖼️ icon128.png        # 128x128 store icon
│   │
│   └── 📂 styles/                # Legacy stylesheets
│       └── 📄 mineshare.css      # Complete design system
│
├── 📂 public/                    # Public assets (Vite)
│
├── 📂 dist/                      # Built extension (generated)
│   ├── 📄 manifest.json
│   ├── 📂 src/                   # Backend code
│   ├── 📂 ui/                    # Frontend code
│   ├── 📂 assets/                # Static assets
│   └── (built files)
│
└── 📂 docs/                      # Documentation
    ├── 📄 AUTHENTICATION_FLOW.md      # Auth flow documentation
    ├── 📄 MINESHARE_REBRAND.md        # Brand guidelines
    ├── 📄 IMPLEMENTATION_SUMMARY.md   # Technical guide
    └── 📄 VISUAL_PREVIEW.md           # Design reference
```

## 🗂️ File Organization Principles

### `/src/` - Backend/Core Code
Core extension functionality:

- **Root level**: Background service worker and content script
- **`/api/`**: Business logic, marketplace, and blockchain APIs
- **`/types/`**: TypeScript type definitions

### `/ui/` - Frontend/UI Code
All user interface code organized by purpose:

- **`/components/`**: Reusable React components (headers, modals, cards, etc.)
- **`/pages/`**: Page-level components (PopupApp, OptionsApp, entry points, HTML)
- **`/styles/`**: Global CSS stylesheets
- **`/assets/`**: UI-specific static assets

### `/assets/` - Static Assets
Non-code resources:

- **`/icons/`**: Extension icons in multiple sizes
- **`/styles/`**: Legacy CSS files

### `/dist/` - Built Extension (Generated)
Output directory from `pnpm run build` - ready to load into Chrome

### `/docs/` - Documentation
All markdown documentation except README

## 🏗️ Build System

### Build Tools:
- **Vite**: Fast build tool with HMR
- **React**: UI framework with hooks
- **pnpm**: Fast, efficient package manager

### Build Scripts:
```bash
pnpm run build         # Build for production
pnpm run build:watch   # Build and watch for changes
pnpm run clean         # Remove dist folder
```

### Build Process:
1. Vite bundles React components
2. Post-build script copies static files
3. API scripts are injected into HTML
4. Final extension in `dist/` folder

## 📋 File Dependencies

### manifest.json → References:
```
ui/pages/popup.html (built to dist/ui/pages/popup.html)
ui/pages/options.html (built to dist/ui/pages/options.html)
src/background.js
src/content_script.js
assets/icons/*.png
```

### popup.html (built) → Loads:
```
../../assets/popup.js (React bundle)
../../assets/styles.js (React styles)
../../assets/styles.css
../../src/api/marketplace.js
../../src/api/walrus.js
```

### PopupApp.jsx → Uses:
```
../components/Header.jsx
../components/Modal.jsx
../components/ListingCard.jsx
../components/StatusMessage.jsx
../components/SplashScreen.jsx
../components/WalletConnect.jsx
window.MarketplaceAPI
window.WalrusAPI
chrome.storage.local
```

## 🚀 Development Workflow

### Initial Setup:
```bash
pnpm install
pnpm run build
```

### Development:
```bash
# Option 1: Build once
pnpm run build

# Option 2: Build and watch (recommended)
pnpm run build:watch
```

### Loading the Extension:
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder (not the root!)

### After Code Changes:
1. Build completes automatically (if using watch mode)
2. Go to `chrome://extensions/`
3. Click refresh icon on MineShare extension
4. Test changes

## 🔍 Quick File Finder

Need to edit something? Here's where to look:

| Task | File Location |
|------|---------------|
| Change extension name | `manifest.json` |
| Update popup UI | `ui/pages/PopupApp.jsx` |
| Update options page | `ui/pages/OptionsApp.jsx` |
| Add reusable component | `ui/components/` |
| Update authentication flow | `ui/components/SplashScreen.jsx` or `WalletConnect.jsx` |
| Modify API methods | `src/api/marketplace.js` |
| Change colors/styles | `ui/styles/styles.css` |
| Update data collection | `src/background.js` |
| Modify page tracking | `src/content_script.js` |
| Change icons | `assets/icons/` |
| Update build config | `vite.config.js` or `build-extension.js` |

## 🧹 Maintenance

### Clean Build:
```bash
pnpm run clean && pnpm run build
```

### Adding New Components:
1. Create `.jsx` file in `ui/components/`
2. Import and use in `ui/pages/PopupApp.jsx` or `ui/pages/OptionsApp.jsx`
3. Rebuild

### Adding New Dependencies:
```bash
pnpm add <package-name>
pnpm add -D <dev-package-name>
```

### Removing Files:
- Always rebuild after removing files
- Update `manifest.json` if removing referenced files
- Update imports in React components

## 📦 Build & Distribution

For packaging the extension:

```bash
# Build for production
pnpm run build

# Create distribution zip
cd dist
zip -r ../mineshare-v1.0.0.zip . -x "*.map"
cd ..
```

---

**Last Updated**: November 10, 2025  
**Structure Version**: 3.0 (React + Vite)
