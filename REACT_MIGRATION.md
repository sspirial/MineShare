# MineShare React Migration

This document describes the migration of MineShare from plain HTML/CSS/JavaScript to React.

## Changes Made

### 1. Dependencies Added
- **React & ReactDOM**: Core React libraries for building the UI
- **Vite**: Modern build tool for fast development and optimized production builds
- **@vitejs/plugin-react**: Vite plugin for React support

### 2. Project Structure

```
src/
  ui/
    components/          # Reusable React components
      Header.jsx         # Header component with logo
      Modal.jsx          # Modal dialog component
      ListingCard.jsx    # Card component for displaying listings
      StatusMessage.jsx  # Status/notification message component
    PopupApp.jsx         # Main Popup React application
    OptionsApp.jsx       # Main Options page React application
    popup-main.jsx       # Popup entry point
    options-main.jsx     # Options entry point
    popup-new.html       # Popup HTML template
    options-new.html     # Options HTML template
    styles.css           # Global styles (extracted from inline styles)
    popup.html           # Old popup (kept for reference)
    popup.js             # Old popup JS (kept for reference)
    options.html         # Old options (kept for reference)
    options.js           # Old options JS (kept for reference)
  background.js          # Background service worker (unchanged)
  content_script.js      # Content script (unchanged)
  api/                   # API modules (unchanged)
    marketplace.js
    walrus.js
    data_api.js
```

### 3. Build System

**Vite Configuration** (`vite.config.js`):
- Configured to build multiple entry points (popup and options)
- Uses relative paths for Chrome extension compatibility
- Generates source maps for debugging
- Doesn't minify code for easier debugging

**Build Script** (`build-extension.js`):
- Copies non-React files (background.js, content_script.js, API files)
- Copies assets (icons, images)
- Copies manifest.json
- Processes HTML files to inject API script tags
- Creates the final `dist/` folder ready for loading into Chrome

**pnpm Scripts**:
```json
"build": "vite build && pnpm run post-build",  // Production build
"build:watch": "vite build --watch",           // Build and watch for changes
"post-build": "node build-extension.js",       // Post-build processing
"clean": "rm -rf dist"                         // Clean dist folder
```

### 4. Component Architecture

#### PopupApp.jsx
The main popup component with three tabs:
- **Collection Tab**: Data collection settings, wallet connection, storage info
- **Listings Tab**: User's marketplace listings with stats
- **Marketplace Tab**: Browse and purchase data listings

State management uses React hooks:
- `useState` for local state
- `useEffect` for side effects and data loading
- All Chrome extension APIs accessed directly

#### OptionsApp.jsx
Full-screen options page with four sections:
- **Dashboard**: Overview with statistics
- **Marketplace**: Browse data marketplace
- **My Listings**: Manage user listings
- **Settings**: Collection preferences and Walrus configuration

#### Shared Components
- **Header**: Logo and title header
- **Modal**: Reusable modal dialog for forms
- **ListingCard**: Card component for displaying data listings
- **StatusMessage**: Auto-dismissing status notifications

### 5. Styling Approach

- Extracted common styles into `styles.css`
- Used CSS custom properties (CSS variables) for theming
- Maintained the original MineShare color scheme (gold and purple)
- Kept inline styles for component-specific styling

### 6. API Integration

The React components access the same global APIs as before:
- `window.MarketplaceAPI` for marketplace operations
- `window.WalrusAPI` for Walrus blockchain integration
- `chrome.storage.local` for local storage
- Scripts are loaded before React app initializes

## Building the Extension

### Development
For development with automatic rebuilds:
```bash
pnpm run build:watch
```
This watches for file changes and rebuilds automatically. After each rebuild, click "Reload" in Chrome's extensions page.

### Production Build
```bash
pnpm run build
```
This creates an optimized build in the `dist/` folder ready to load into Chrome.

### Loading in Chrome
1. Build the extension: `pnpm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder

## Benefits of React Migration

1. **Component Reusability**: UI components can be easily reused and tested
2. **State Management**: React's state management simplifies complex UI interactions
3. **Better Developer Experience**: Hot module replacement, better debugging
4. **Maintainability**: Cleaner code organization and easier to extend
5. **Modern Tooling**: Vite provides fast builds and modern JavaScript features
6. **Type Safety Ready**: Easy to add TypeScript in the future

## Backward Compatibility

The original HTML/CSS/JavaScript files are kept in the repository for reference:
- `src/ui/popup.html` and `src/ui/popup.js` (original popup)
- `src/ui/options.html` and `src/ui/options.js` (original options)

The React version maintains the same functionality and visual design as the original.

## Future Improvements

1. **TypeScript**: Add TypeScript for better type safety
2. **Testing**: Add Jest and React Testing Library for component tests
3. **State Management**: Consider adding Redux or Zustand for complex state
4. **Code Splitting**: Further optimize bundle size with lazy loading
5. **Storybook**: Add Storybook for component development and documentation

## Troubleshooting

### Extension doesn't load
- Make sure you've run `pnpm run build`
- Check that the `dist/` folder exists and contains all necessary files
- Check the Chrome extension console for errors

### Styles not loading
- Verify that `assets/styles.css` is in the dist folder
- Check that the HTML files reference the correct CSS path

### API functions not available
- Make sure `marketplace.js` and `walrus.js` are loaded before the React app
- Check the build script ensures these are injected into HTML

### Build errors
- Delete `node_modules` and `dist` folders
- Run `pnpm install` again
- Try `pnpm run build` again
