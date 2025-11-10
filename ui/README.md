# MineShare UI Workspace

This repository root only contains `.gitignore`, the main `README.md`, and the `ui/` folder. All functional code (frontend + backend extension logic + build tooling) lives inside `ui/`.

## 🔧 Contents of `ui/`
```
ui/
├── assets/              # Icons & static style assets
├── components/          # Reusable React components
├── pages/               # Page-level React apps + HTML templates
├── src/                 # Extension core (background, content script, APIs)
├── styles/              # Global CSS
├── docs/                # Internal documentation
├── dist/                # Build output (generated)
├── manifest.json        # Chrome extension manifest
├── package.json         # Dependencies & scripts
├── build-extension.js   # Post-build processing
├── vite.config.js       # Vite configuration
```

## 🚀 Development
From the repository root:
```bash
cd ui
pnpm install
pnpm run build          # Build once
pnpm run build:watch    # Rebuild on changes
```

### Load in Chrome
1. Run `pnpm run build` inside `ui/`
2. Open `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked"
5. Select `ui/dist/`

## 📂 Key Entry Points
| Purpose | File |
|---------|------|
| Popup React App | `pages/popup-main.jsx` -> `PopupApp.jsx` |
| Options React App | `pages/options-main.jsx` -> `OptionsApp.jsx` |
| Background Worker | `src/background.js` |
| Content Script | `src/content_script.js` |
| APIs | `src/api/*.js` |
| Manifest | `manifest.json` |

## 🔐 Authentication & Wallet Flow
Implemented in:
- `components/SplashScreen.jsx`
- `components/WalletConnect.jsx`
- Integrated in `pages/PopupApp.jsx` & `pages/OptionsApp.jsx`

## 🧪 Common Tasks
```bash
pnpm run clean          # Remove dist
pnpm add <pkg>          # Add dependency
pnpm add -D <pkg>       # Add dev dependency
```

## 🛠 Adjusting Build
- Change HTML inputs: `vite.config.js`
- Post-build HTML/asset processing: `build-extension.js`
- Output directory: `dist/`

## 🗃 Data Storage
Uses `chrome.storage.local` with keys:
- `activity_events_v1`
- `collector_prefs`
- `walrus_config_v1`

## ✅ Checklist Before Commit
- Build passes (`pnpm run build`)
- Manifest paths still valid
- No unused files left in root

## 📄 More Docs
See:
- `docs/AUTHENTICATION_FLOW.md`
- `docs/REORGANIZATION.md`
- `STRUCTURE.md`
- `UI_REFERENCE.md`

---
Happy hacking inside `ui/`! 🎉
