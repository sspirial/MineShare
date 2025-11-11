# Shared Resources

This folder contains shared code and configuration used across both the browser extension (`ui/`) and the marketplace dApp (`dapp/`).

## Files

- **config.js** - Centralized configuration for network, smart contracts, and Walrus storage
- **utils.js** - Common utility functions (hashing, domain extraction, formatting, etc.)

## Usage

### In Browser Extension (ui/)

```javascript
import { CONFIG } from '../../shared/config.js';
import { hashStringHex, extractDomain } from '../../shared/utils.js';
```

### In dApp (dapp/)

```javascript
import { CONFIG } from '../../shared/config.js';
import { formatBytes, formatDate } from '../../shared/utils.js';
```

## Why Shared?

Having a single source of truth for configuration and common utilities:
- Reduces code duplication
- Makes updates easier (change once, applies everywhere)
- Ensures consistency across the project
- Simplifies maintenance

## Adding New Shared Code

When you find yourself copying code between `ui/` and `dapp/`, consider moving it here if it's:
- Configuration values
- Utility functions
- Type definitions
- Constants
- Helper functions
