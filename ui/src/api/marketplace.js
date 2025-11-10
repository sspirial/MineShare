/**
 * Marketplace Module - Data Listing and Trading System
 * Production-ready marketplace logic with wallet integration hooks
 * 
 * Features:
 * - Create and manage data listings
 * - Browse and purchase datasets
 * - Wallet connection simulation with hooks for Web3
 * - Local storage simulation for MVP
 * - Complete error handling and validation
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const MARKETPLACE_CONFIG = {
  storageKeys: {
    listings: 'marketplace_listings_v1',
    transactions: 'marketplace_transactions_v1',
    wallet: 'marketplace_wallet_v1'
  },
  minPrice: 0.01,
  maxPrice: 10000,
  // Placeholder for blockchain config - ready for Web3 integration
  blockchain: {
    network: 'testnet',
    contractAddress: null, // To be set when smart contract deployed
    gasLimit: 300000
  }
};

// ============================================================================
// WALLET INTEGRATION (Hooks for Web3/Blockchain)
// ============================================================================

class WalletService {
  constructor() {
    this.connected = false;
    this.address = null;
    this.balance = 0;
  }

  /**
   * Connect wallet - Placeholder for MetaMask/WalletConnect integration
   * TODO: Replace with actual Web3 provider (window.ethereum)
   */
  async connect() {
    try {
      // Simulate wallet connection
      // In production, this would be:
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const accounts = await provider.send("eth_requestAccounts", []);
      
      // Simulated connection
      await this._simulateDelay(500);
      
      this.connected = true;
      this.address = '0x' + Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      this.balance = Math.random() * 10 + 1; // Simulated balance
      
      // Store wallet info
      await chrome.storage.local.set({
        [MARKETPLACE_CONFIG.storageKeys.wallet]: {
          connected: this.connected,
          address: this.address,
          connectedAt: Date.now()
        }
      });
      
      return { success: true, address: this.address };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    this.connected = false;
    this.address = null;
    this.balance = 0;
    
    await chrome.storage.local.remove([MARKETPLACE_CONFIG.storageKeys.wallet]);
    return { success: true };
  }

  /**
   * Sign transaction - Placeholder for blockchain transaction signing
   * TODO: Implement actual transaction signing with Web3
   */
  async signTransaction(txData) {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      await this._simulateDelay(800);
      
      // In production, this would be:
      // const signer = provider.getSigner();
      // const tx = await signer.sendTransaction(txData);
      // await tx.wait();
      
      const signature = '0x' + Array(130).fill(0).map(() =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      return {
        success: true,
        signature,
        txHash: '0x' + Array(64).fill(0).map(() =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('')
      };
    } catch (error) {
      throw new Error(`Transaction signing failed: ${error.message}`);
    }
  }

  /**
   * Get wallet status
   */
  async getStatus() {
    try {
      const stored = await chrome.storage.local.get([MARKETPLACE_CONFIG.storageKeys.wallet]);
      if (stored && stored[MARKETPLACE_CONFIG.storageKeys.wallet]) {
        const data = stored[MARKETPLACE_CONFIG.storageKeys.wallet];
        this.connected = data.connected;
        this.address = data.address;
        return { connected: this.connected, address: this.address };
      }
    } catch (error) {
      console.error('Failed to get wallet status:', error);
    }
    return { connected: false, address: null };
  }

  async _simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// LISTING MANAGEMENT
// ============================================================================

class ListingService {
  /**
   * Create a new data listing
   */
  async createListing(listingData) {
    try {
      // Validation
      const validation = this._validateListing(listingData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate listing ID
      const listingId = 'lst_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      const listing = {
        id: listingId,
        sellerId: listingData.sellerId || 'anonymous',
        title: listingData.title,
        description: listingData.description,
        dataType: listingData.dataType,
        dataSize: listingData.dataSize,
        price: parseFloat(listingData.price),
        timeRange: listingData.timeRange,
        createdAt: Date.now(),
        status: 'listed', // listed, sold, cancelled
        views: 0,
        metadata: listingData.metadata || {}
      };

      // Walrus integration: compute a commitment of the user's data and register it (best-effort)
      try {
        // Compute a stable data hash of current collected events (privacy: uses stored anonymized events)
        const helper = new DataCollectionHelper();
        const dataInfo = await helper.getCollectedDataInfo();
        if (!dataInfo.isEmpty) {
          const dataHash = await helper.computeDataHash(dataInfo.events);
          if (dataHash && window && window.WalrusAPI) {
            const commitRes = await window.WalrusAPI.commitListing({ listing, dataHash });
            listing.metadata.walrus = {
              dataHash,
              commitmentCid: commitRes && commitRes.commitmentCid || null,
              txHash: commitRes && commitRes.txHash || null,
              endpoint: commitRes && commitRes.endpoint || null,
              simulated: !!(commitRes && commitRes.simulated)
            };
          } else {
            // Store the local data hash even if Walrus is not enabled
            listing.metadata.walrus = { dataHash, commitmentCid: null, txHash: null, endpoint: null, simulated: true };
          }
        }
      } catch (e) {
        console.warn('Walrus commit skipped:', e);
      }

      // Store listing
      const stored = await chrome.storage.local.get([MARKETPLACE_CONFIG.storageKeys.listings]);
      const listings = stored[MARKETPLACE_CONFIG.storageKeys.listings] || [];
      listings.push(listing);
      
      await chrome.storage.local.set({
        [MARKETPLACE_CONFIG.storageKeys.listings]: listings
      });

      return { success: true, listing };
    } catch (error) {
      console.error('Failed to create listing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all listings
   */
  async getAllListings() {
    try {
      const stored = await chrome.storage.local.get([MARKETPLACE_CONFIG.storageKeys.listings]);
      return stored[MARKETPLACE_CONFIG.storageKeys.listings] || [];
    } catch (error) {
      console.error('Failed to get listings:', error);
      return [];
    }
  }

  /**
   * Get user's own listings
   */
  async getMyListings(sellerId) {
    const allListings = await this.getAllListings();
    return allListings.filter(l => l.sellerId === sellerId);
  }

  /**
   * Get marketplace listings (exclude own)
   */
  async getMarketplaceListings(excludeSellerId) {
    const allListings = await this.getAllListings();
    return allListings.filter(l => 
      l.status === 'listed' && l.sellerId !== excludeSellerId
    );
  }

  /**
   * Update listing status
   */
  async updateListingStatus(listingId, status) {
    try {
      const stored = await chrome.storage.local.get([MARKETPLACE_CONFIG.storageKeys.listings]);
      const listings = stored[MARKETPLACE_CONFIG.storageKeys.listings] || [];
      
      const listing = listings.find(l => l.id === listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      listing.status = status;
      listing.updatedAt = Date.now();

      await chrome.storage.local.set({
        [MARKETPLACE_CONFIG.storageKeys.listings]: listings
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete listing
   */
  async deleteListing(listingId) {
    try {
      const stored = await chrome.storage.local.get([MARKETPLACE_CONFIG.storageKeys.listings]);
      const listings = stored[MARKETPLACE_CONFIG.storageKeys.listings] || [];
      
      const filtered = listings.filter(l => l.id !== listingId);
      
      await chrome.storage.local.set({
        [MARKETPLACE_CONFIG.storageKeys.listings]: filtered
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate listing data
   */
  _validateListing(data) {
    if (!data.title || data.title.trim().length < 3) {
      return { valid: false, error: 'Title must be at least 3 characters' };
    }
    if (!data.description || data.description.trim().length < 10) {
      return { valid: false, error: 'Description must be at least 10 characters' };
    }
    if (!data.dataType) {
      return { valid: false, error: 'Data type is required' };
    }
    if (!data.dataSize || data.dataSize < 1) {
      return { valid: false, error: 'Invalid data size' };
    }
    if (!data.price || data.price < MARKETPLACE_CONFIG.minPrice) {
      return { valid: false, error: `Price must be at least $${MARKETPLACE_CONFIG.minPrice}` };
    }
    if (data.price > MARKETPLACE_CONFIG.maxPrice) {
      return { valid: false, error: `Price cannot exceed $${MARKETPLACE_CONFIG.maxPrice}` };
    }
    return { valid: true };
  }
}

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

class TransactionService {
  /**
   * Purchase a data listing
   */
  async purchaseListing(listingId, buyerId, walletService) {
    try {
      // Get listing
      const listingService = new ListingService();
      const listings = await listingService.getAllListings();
      const listing = listings.find(l => l.id === listingId);
      
      if (!listing) {
        throw new Error('Listing not found');
      }
      if (listing.status !== 'listed') {
        throw new Error('Listing is no longer available');
      }
      if (listing.sellerId === buyerId) {
        throw new Error('Cannot purchase your own listing');
      }

      // Simulate blockchain transaction
      const txData = {
        from: walletService.address,
        to: MARKETPLACE_CONFIG.blockchain.contractAddress || '0x0000000000000000000000000000000000000000',
        value: listing.price,
        gas: MARKETPLACE_CONFIG.blockchain.gasLimit,
        data: JSON.stringify({ listingId, action: 'purchase' })
      };

      const signResult = await walletService.signTransaction(txData);
      if (!signResult.success) {
        throw new Error('Transaction failed');
      }

      // Optional: record purchase on Walrus (best-effort)
      let walrusReceiptId = null;
      if (window && window.WalrusAPI) {
        try {
          const res = await window.WalrusAPI.recordPurchase({
            listingId,
            buyer: buyerId,
            price: listing.price,
            txHint: signResult.txHash
          });
          walrusReceiptId = res && res.receiptId ? res.receiptId : null;
        } catch (e) {
          console.warn('Walrus purchase record failed:', e);
        }
      }

      // Create transaction record
      const transaction = {
        id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        listingId,
        sellerId: listing.sellerId,
        buyerId,
        price: listing.price,
        txHash: signResult.txHash,
        signature: signResult.signature,
        timestamp: Date.now(),
        status: 'completed', // completed, pending, failed
        walrusReceiptId,
        walrusCommitCid: listing && listing.metadata && listing.metadata.walrus ? listing.metadata.walrus.commitmentCid : null
      };

      // Store transaction
      const stored = await chrome.storage.local.get([MARKETPLACE_CONFIG.storageKeys.transactions]);
      const transactions = stored[MARKETPLACE_CONFIG.storageKeys.transactions] || [];
      transactions.push(transaction);
      
      await chrome.storage.local.set({
        [MARKETPLACE_CONFIG.storageKeys.transactions]: transactions
      });

      // Update listing status
      await listingService.updateListingStatus(listingId, 'sold');

      return { success: true, transaction };
    } catch (error) {
      console.error('Purchase failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(userId) {
    try {
      const stored = await chrome.storage.local.get([MARKETPLACE_CONFIG.storageKeys.transactions]);
      const transactions = stored[MARKETPLACE_CONFIG.storageKeys.transactions] || [];
      
      // Return transactions where user is buyer or seller
      return transactions.filter(t => 
        t.buyerId === userId || t.sellerId === userId
      );
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  }

  /**
   * Get earnings for a seller
   */
  async getEarnings(sellerId) {
    const transactions = await this.getTransactions(sellerId);
    const earnings = transactions
      .filter(t => t.sellerId === sellerId && t.status === 'completed')
      .reduce((sum, t) => sum + t.price, 0);
    
    return earnings;
  }
}

// ============================================================================
// DATA COLLECTION HELPERS
// ============================================================================

class DataCollectionHelper {
  /**
   * Get collected data metadata for listing creation
   */
  async getCollectedDataInfo() {
    try {
      const stored = await chrome.storage.local.get(['activity_events_v1']);
      const events = stored.activity_events_v1 || [];
      
      if (events.length === 0) {
        return {
          size: 0,
          timeRange: 'No data collected',
          isEmpty: true
        };
      }

      // Calculate time range
      const timestamps = events.map(e => e.ts).filter(Boolean);
      const minTs = Math.min(...timestamps);
      const maxTs = Math.max(...timestamps);
      const startDate = new Date(minTs).toLocaleDateString();
      const endDate = new Date(maxTs).toLocaleDateString();

      return {
        size: events.length,
        timeRange: startDate === endDate ? startDate : `${startDate} - ${endDate}`,
        isEmpty: false,
        events: events
      };
    } catch (error) {
      console.error('Failed to get collected data:', error);
      return { size: 0, timeRange: 'Error', isEmpty: true };
    }
  }

  /**
   * Compute a deterministic hash of the provided events array for Walrus commitment
   */
  async computeDataHash(events) {
    try {
      const stable = this._stableStringify(events || []);
      const enc = new TextEncoder();
      const data = enc.encode(stable);
      const digest = await crypto.subtle.digest('SHA-256', data);
      const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
      return '0x' + hex;
    } catch (e) {
      console.warn('computeDataHash failed:', e);
      return null;
    }
  }

  _stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(v => this._stableStringify(v)).join(',') + ']';
    const keys = Object.keys(value).sort();
    const parts = keys.map(k => '"' + k + '":' + this._stableStringify(value[k]));
    return '{' + parts.join(',') + '}';
  }
}

// ============================================================================
// EXPORT SERVICES
// ============================================================================

window.MarketplaceAPI = {
  wallet: new WalletService(),
  listing: new ListingService(),
  transaction: new TransactionService(),
  dataHelper: new DataCollectionHelper(),
  config: MARKETPLACE_CONFIG
};

console.log('Marketplace API initialized');
