# MineShare - Project Structure

This document describes the organized directory structure of the MineShare Chrome extension.

## 📁 Directory Layout

```
mineshare-extension/
│
├── 📄 manifest.json              # Extension manifest (entry point)
├── 📄 README.md                  # Project documentation
├── 📄 .gitignore                 # Git ignore rules
│
├── 📂 src/                       # Source code
│   ├── 📄 background.js          # Service worker (data collection)
│   ├── 📄 content_script.js      # Page interaction tracker
│   │
│   ├── 📂 ui/                    # User interface files
│   │   ├── 📄 popup.html         # Extension popup (400px)
│   │   ├── 📄 popup.js           # Popup controller
│   │   ├── 📄 options.html       # Full-page marketplace
│   │   └── 📄 options.js         # Options controller
│   │
│   ├── 📂 api/                   # API & business logic
│   │   ├── 📄 marketplace.js     # Marketplace API (wallet, listings, transactions)
│   │   └── 📄 data_api.js        # Data aggregation helper
│   │
│   └── 📂 types/                 # TypeScript definitions
│       └── 📄 types.d.ts         # Type definitions
│
├── 📂 assets/                    # Static assets
│   ├── 📂 icons/                 # Extension icons
│   │   ├── 🖼️ icon16.png         # 16x16 toolbar icon
│   │   ├── 🖼️ icon48.png         # 48x48 management icon
│   │   └── 🖼️ icon128.png        # 128x128 store icon
│   │
│   └── 📂 styles/                # Stylesheets
│       └── 📄 mineshare.css      # Complete design system
│
└── 📂 docs/                      # Documentation
    ├── 📄 MINESHARE_REBRAND.md        # Brand guidelines
    ├── 📄 IMPLEMENTATION_SUMMARY.md   # Technical implementation guide
    └── 📄 VISUAL_PREVIEW.md           # Design reference & mockups
```

## 🗂️ File Organization Principles

### `/src/` - Source Code
All executable JavaScript and HTML files live here, organized by function:

- **Root level**: Core extension files (background, content script)
- **`/ui/`**: All user-facing HTML/JS files
- **`/api/`**: Business logic and API modules
- **`/types/`**: TypeScript type definitions

### `/assets/` - Static Assets
Non-code resources organized by type:

- **`/icons/`**: Extension icons in multiple sizes
- **`/styles/`**: CSS files (design system)

### `/docs/` - Documentation
All markdown documentation except README:

- Brand guidelines
- Implementation guides
- Visual references

## 📋 File Dependencies

### manifest.json → References:
```
src/ui/popup.html
src/ui/options.html
src/background.js
src/content_script.js
assets/icons/*.png
```

### popup.html → Loads:
```
../api/marketplace.js
popup.js
```

### options.html → Loads:
```
../api/marketplace.js
options.js
```

### background.js → Imports:
```
api/data_api.js (via importScripts)
```

## 🚀 Development Workflow

### Running the Extension:
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the root `mineshare-extension/` folder

### Editing Files:
- **UI Changes**: Edit files in `src/ui/`
- **Business Logic**: Edit files in `src/api/`
- **Styling**: Edit `assets/styles/mineshare.css`
- **Icons**: Replace files in `assets/icons/`
- **Manifest**: Edit `manifest.json` in root

### After Changes:
1. Go to `chrome://extensions/`
2. Click refresh icon on MineShare extension
3. Test changes

## 📦 Build & Distribution

For packaging the extension:

```bash
# Create distribution zip (from parent directory)
zip -r mineshare-v1.0.0.zip mineshare-extension/ \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*.DS_Store"
```

## 🔍 Quick File Finder

Need to edit something? Here's where to look:

| Task | File Location |
|------|---------------|
| Change extension name | `manifest.json` |
| Update popup UI | `src/ui/popup.html` |
| Update popup logic | `src/ui/popup.js` |
| Update marketplace page | `src/ui/options.html` |
| Modify API methods | `src/api/marketplace.js` |
| Change colors/styles | `assets/styles/mineshare.css` |
| Update data collection | `src/background.js` |
| Modify page tracking | `src/content_script.js` |
| Change icons | `assets/icons/` |
| Update documentation | `docs/` or `README.md` |

## 🧹 Maintenance

### Backup Files:
- All backup files (`.backup`, `*-old.*`, `*_old.*`) are ignored via `.gitignore`
- Safe to create temporary backups during development

### Adding New Files:
- **UI components**: Add to `src/ui/`
- **APIs/utilities**: Add to `src/api/`
- **Assets**: Add to appropriate `assets/` subfolder
- **Documentation**: Add to `docs/`

### Removing Files:
Always update `manifest.json` if removing files that are referenced there.

---

**Last Updated**: November 9, 2025  
**Structure Version**: 2.0 (Organized)
