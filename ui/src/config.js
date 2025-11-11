/**
 * MineShare Extension Configuration
 * Update these values when deploying to different networks
 */

export const CONFIG = {
  // Sui Network Configuration
  NETWORK: 'testnet',

  // Smart Contract Configuration
  PACKAGE_ID: '0xa220e3bf27fe8c285d1995fdc7d498ebe18650733c8d64ea436db244ab65fb89',
  MODULE_NAME: 'marketplace',
  
  // Walrus Storage
  WALRUS_PUBLISHER: 'https://publisher.walrus-testnet.walrus.space',
  WALRUS_AGGREGATOR: 'https://aggregator.walrus-testnet.walrus.space',
  
  // dApp URL
  DAPP_URL: 'http://localhost:3000', // Update for production
};

export default CONFIG;
