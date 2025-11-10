/**
 * MineShare Extension Configuration
 * Update these values when deploying to different networks
 */

export const CONFIG = {
  // Sui Network
  NETWORK: 'testnet', // 'mainnet' | 'testnet' | 'devnet'
  
  // Smart Contract
  PACKAGE_ID: '0x2cf73e2764bedfd840acd574a89ac4e3e34c77992a3565ed2da3853543dd9243',
  MODULE_NAME: 'marketplace',
  
  // Walrus Storage
  WALRUS_PUBLISHER: 'https://publisher.walrus-testnet.walrus.space',
  WALRUS_AGGREGATOR: 'https://aggregator.walrus-testnet.walrus.space',
  
  // dApp URL
  DAPP_URL: 'http://localhost:3000', // Update for production
};

export default CONFIG;
