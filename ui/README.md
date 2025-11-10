# MineShare Browser Extension

A lightweight Chrome extension for collecting browsing activity data in a privacy-preserving manner.

## 🎯 Purpose

This extension collects browsing data with privacy protections:
- Hashed URLs (never stores plain URLs)
- Page titles, time tracking, interactions
- User-controlled data collection categories
- Local storage only

## 🔧 Structure
```
ui/
├── assets/              # Icons & static assets
├── src/
│   ├── components/      # React components (Header, StatusMessage)
│   ├── pages/           # Popup & Options pages
│   ├── api/             # Data aggregation API
│   ├── background.js    # Background service worker
│   └── content_script.js # Data collection script
├── dist/                # Build output (generated)
├── manifest.json        # Chrome extension manifest
├── package.json         # Dependencies & scripts
├── build-extension.js   # Post-build processing
└── vite.config.js       # Vite configuration
```

## 🚀 Development
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

## 📂 Key Files
| Purpose | File |
|---------|------|
| Popup Interface | `pages/PopupApp.jsx` |
| Options Page | `pages/OptionsApp.jsx` |
| Background Worker | `src/background.js` |
| Content Script | `src/content_script.js` |
| Data API | `src/api/data_api.js` |
| Manifest | `manifest.json` |

## 🔐 Privacy Features
- URLs are hashed (SHA-256) before storage
- No keystrokes or clipboard data collected
- Input fields and sensitive areas excluded
- User controls what categories to collect
- All data stored locally in browser

## 🗃 Data Storage
Uses `chrome.storage.local` with keys:
- `activity_events_v1` - Collected browsing events
- `collector_prefs` - User preferences

## 🧪 Common Tasks
```bash
pnpm run clean          # Remove dist
pnpm run build          # Build extension
pnpm add <pkg>          # Add dependency
```

## ✅ Features
- **Data Collection Settings**: Enable/disable collection globally or by category
- **Storage Management**: View and delete collected data by domain
- **Privacy Controls**: Full user control over what gets collected
- **Storage Info**: Real-time storage usage statistics

---

Happy hacking! 🎉
