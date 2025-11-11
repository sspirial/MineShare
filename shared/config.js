/**
 * MineShare Shared Configuration
 * Used across both the browser extension (ui/) and dApp (dapp/)
 * Update these values when deploying to different networks
 */

export const CONFIG = {
  // Sui Network Configuration
  NETWORK: 'testnet', // 'mainnet' | 'testnet' | 'devnet'
  
  // Smart Contract Configuration
  PACKAGE_ID: '0xa220e3bf27fe8c285d1995fdc7d498ebe18650733c8d64ea436db244ab65fb89',
  MODULE_NAME: 'marketplace',
  
  // Walrus Storage Configuration
  WALRUS_PUBLISHER: 'https://publisher.walrus-testnet.walrus.space',
  WALRUS_AGGREGATOR: 'https://aggregator.walrus-testnet.walrus.space',
  
  // dApp URL (used by extension to open marketplace)
  DAPP_URL: 'http://localhost:3000', // Update for production: 'https://mineshare.app'
  
  // Data Collection Configuration
  STORAGE_KEY: 'activity_events_v1',
  TOP_KEYWORDS_COUNT: 10,
  
  // Export Configuration
  EXPORT_VALIDITY_MS: 5 * 60 * 1000, // 5 minutes
};

export default CONFIG;
