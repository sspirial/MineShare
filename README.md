# MineShare - Privacy-First Data Collection ⛏️

**Mine your data, manage it securely**

A privacy-first browser extension that allows users to collect and manage their browsing data securely with full user control.

## 📁 Project Structure

### 🔐 **ui/** - Browser Extension
A lightweight Chrome extension for data collection:
- Collects browsing activity data
- Privacy-preserving (URL hashing, no sensitive data)
- Configurable data categories
- Local storage with user control
- View and manage collected data by domain

**Tech Stack**: React + Vite + Chrome Extension API  
**See**: [ui/README.md](ui/README.md)

### 📜 **move/** - Smart Contracts (Future Use)
Blockchain contracts for potential future marketplace features.

**Tech Stack**: Move language on Sui blockchain  
**Location**: [move/mineshare/](move/mineshare/)

---

## 🚀 Quick Start

### Build the Browser Extension
```bash
cd ui
pnpm install
pnpm run build
```

### Load in Chrome
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `ui/dist/` directory

### Use the Extension
1. Click the extension icon to open settings
2. Enable data collection
3. Configure which categories to collect
4. Browse normally - data is collected automatically
5. View/manage collected data in the popup or options page

## 🔒 Privacy Features

- **URLs are hashed** (SHA-256) before storage - never stores plain URLs
- **No keystroke or clipboard data** collected
- **Input fields excluded** - no passwords, form data, or sensitive text
- **User controls** - enable/disable globally or by category
- **Local storage only** - data never leaves your browser
- **Per-domain management** - view and delete data for specific sites

## 🏗️ Architecture

```
┌─────────────────────┐
│   UI Extension      │
│  (Data Collection)  │
│                     │
│  • Background.js    │─── Collects events
│  • Content Script   │─── Page interactions
│  • Popup UI         │─── Settings & view
│  • Options Page     │─── Full management
└─────────────────────┘
          │
          ▼
   chrome.storage.local
   (Hashed URLs + metadata)
```

## 📊 Collected Data Categories

You can enable/disable each category:


## 🎯 What Gets Collected

| Category | What's Collected | Privacy Notes |
|----------|-----------------|---------------|
| URLs | SHA-256 hash only | Original URL never stored |
| Titles | Page titles | Visible text only |
| Time | Duration on pages | Aggregated by session |
| Interactions | Clicks, scrolls | No text content, just patterns |
| Referrers | Where you came from | Domain level only |
| Sessions | Browsing sessions | Time-based grouping |
| Categories | Page type (news, social, etc.) | Auto-classified |
| Keywords | Common words on page | Excludes all input fields |

## 🛠️ Development

### File Structure
```
MineShare/
├── ui/                      # Browser Extension
│   ├── src/
│   │   ├── pages/          # React pages (Popup, Options)
│   │   ├── components/     # React components
│   │   ├── api/            # Data APIs
│   │   ├── background.js   # Service worker
│   │   └── content_script.js # Data collection
│   ├── assets/             # Icons & styles
│   ├── manifest.json       # Extension config
│   └── package.json
│
├── move/mineshare/         # Smart contracts (future)
│   ├── sources/
│   └── Move.toml
│
└── README.md               # This file
```

### Tech Stack
- **UI**: React + Vite
- **Build**: Vite + custom build script
- **Storage**: chrome.storage.local API
- **Privacy**: SHA-256 hashing, input field exclusion
- **Contracts**: Move language (Sui blockchain)

## 📝 License

This project is for educational purposes.

## 🙏 Acknowledgments

Built for privacy-conscious users who want control over their data.

---

**Note**: This is a data collection tool only. No marketplace, wallet, or blockchain features are currently active. The extension focuses solely on privacy-preserving data collection with full user control.
