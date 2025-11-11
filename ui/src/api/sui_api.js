/**
 * Sui blockchain API for MineShare extension
 * Handles dataset minting and wallet interactions
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { CONFIG } from '../config.js';

// Contract configuration from shared config
export const PACKAGE_ID = CONFIG.PACKAGE_ID;
export const MODULE_NAME = CONFIG.MODULE_NAME;
export const NETWORK = CONFIG.NETWORK;

// Initialize Sui client
export function getSuiClient() {
  return new SuiClient({ 
    url: `https://fullnode.${NETWORK}.sui.io:443`
  });
}

/**
 * Mint a dataset NFT on Sui blockchain
 * @param {Array<number>} cidBytes - CID as byte array
 * @param {Object} metadata - Dataset metadata
 * @param {Object} walletApi - Connected wallet API (from wallet standard)
 * @returns {Promise<{digest: string, datasetId: string}>}
 */
export async function mintDataset(cidBytes, metadata, walletApi) {
  try {
    const client = getSuiClient();
    const tx = new Transaction();
    
    // Encode metadata as JSON bytes
    const encoder = new TextEncoder();
    const metaBytes = Array.from(encoder.encode(JSON.stringify(metadata)));
    
    // Call mint_dataset function
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::mint_dataset`,
      arguments: [
        tx.pure.vector('u8', cidBytes),
        tx.pure.vector('u8', metaBytes)
      ],
    });
    
    // Sign and execute transaction
    const result = await walletApi.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    
    if (result.effects?.status?.status !== 'success') {
      throw new Error('Transaction failed: ' + result.effects?.status?.error);
    }
    
    // Extract created Dataset object ID
    const createdObjects = result.objectChanges?.filter(
      change => change.type === 'created' && change.objectType?.includes('Dataset')
    ) || [];
    
    const datasetId = createdObjects[0]?.objectId;
    
    return {
      digest: result.digest,
      datasetId: datasetId || null,
      effects: result.effects
    };
  } catch (error) {
    console.error('Mint dataset error:', error);
    throw error;
  }
}

/**
 * Get Dataset objects owned by an address
 * @param {string} address - Owner address
 * @returns {Promise<Array>}
 */
export async function getOwnedDatasets(address) {
  try {
    const client = getSuiClient();
    
    const objects = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${PACKAGE_ID}::${MODULE_NAME}::Dataset`
      },
      options: {
        showContent: true,
        showType: true
      }
    });
    
    return objects.data.map(obj => ({
      id: obj.data.objectId,
      type: obj.data.type,
      content: obj.data.content
    }));
  } catch (error) {
    console.error('Get owned datasets error:', error);
    return [];
  }
}

/**
 * Create a listing for a dataset
 * @param {string} datasetId - Dataset object ID
 * @param {number} priceInSui - Price in SUI (will be converted to MIST)
 * @param {Object} walletApi - Connected wallet API
 * @returns {Promise<{digest: string, listingId: string}>}
 */
export async function createListing(datasetId, priceInSui, walletApi) {
  try {
    const tx = new Transaction();
    
    // Convert SUI to MIST (1 SUI = 1_000_000_000 MIST)
    const priceInMist = Math.floor(priceInSui * 1_000_000_000);
    
    // Call create_listing function
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::create_listing`,
      arguments: [
        tx.object(datasetId),
        tx.pure.u64(priceInMist)
      ],
    });
    
    const result = await walletApi.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true
      },
    });
    
    if (result.effects?.status?.status !== 'success') {
      throw new Error('Transaction failed: ' + result.effects?.status?.error);
    }
    
    // Extract created Listing object ID
    const createdObjects = result.objectChanges?.filter(
      change => change.type === 'created' && change.objectType?.includes('Listing')
    ) || [];
    
    const listingId = createdObjects[0]?.objectId;
    
    return {
      digest: result.digest,
      listingId: listingId || null,
      events: result.events
    };
  } catch (error) {
    console.error('Create listing error:', error);
    throw error;
  }
}

/**
 * Buy a listing
 * @param {string} listingId - Listing object ID
 * @param {number} priceInSui - Price in SUI
 * @param {Object} walletApi - Connected wallet API
 * @param {string} buyerAddress - Buyer's address
 * @returns {Promise<{digest: string}>}
 */
export async function buyListing(listingId, priceInSui, walletApi, buyerAddress) {
  try {
    const client = getSuiClient();
    const tx = new Transaction();
    
    // Convert SUI to MIST
    const priceInMist = Math.floor(priceInSui * 1_000_000_000);
    
    // Get buyer's SUI coins
    const coins = await client.getCoins({
      owner: buyerAddress,
      coinType: '0x2::sui::SUI'
    });
    
    if (coins.data.length === 0) {
      throw new Error('No SUI coins found in wallet');
    }
    
    // Merge coins if needed and split exact amount
    const [primaryCoin, ...otherCoins] = coins.data;
    
    if (otherCoins.length > 0) {
      tx.mergeCoins(
        tx.object(primaryCoin.coinObjectId),
        otherCoins.map(coin => tx.object(coin.coinObjectId))
      );
    }
    
    const payment = tx.splitCoins(tx.object(primaryCoin.coinObjectId), [tx.pure.u64(priceInMist)]);
    
    // Call buy_listing function
    const result = tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::buy_listing`,
      arguments: [
        tx.object(listingId),
        payment
      ],
    });
    
    // Transfer the change back to sender
    tx.transferObjects([result], tx.pure.address(buyerAddress));
    
    const txResult = await walletApi.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true
      },
    });
    
    if (txResult.effects?.status?.status !== 'success') {
      throw new Error('Transaction failed: ' + txResult.effects?.status?.error);
    }
    
    return {
      digest: txResult.digest,
      events: txResult.events
    };
  } catch (error) {
    console.error('Buy listing error:', error);
    throw error;
  }
}

/**
 * Claim dataset after purchase
 * @param {string} listingId - Listing object ID
 * @param {Object} walletApi - Connected wallet API
 * @param {string} buyerAddress - Buyer's address
 * @returns {Promise<{digest: string, datasetId: string}>}
 */
export async function claimDataset(listingId, walletApi, buyerAddress) {
  try {
    const tx = new Transaction();
    
    // Call claim_dataset function
    const dataset = tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::claim_dataset`,
      arguments: [
        tx.object(listingId)
      ],
    });
    
    // Transfer dataset to buyer
    tx.transferObjects([dataset], tx.pure.address(buyerAddress));
    
    const result = await walletApi.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
        showObjectChanges: true
      },
    });
    
    if (result.effects?.status?.status !== 'success') {
      throw new Error('Transaction failed: ' + result.effects?.status?.error);
    }
    
    // Extract transferred Dataset object ID
    const transferredObjects = result.objectChanges?.filter(
      change => change.type === 'created' && change.objectType?.includes('Dataset')
    ) || [];
    
    const datasetId = transferredObjects[0]?.objectId;
    
    return {
      digest: result.digest,
      datasetId: datasetId || null
    };
  } catch (error) {
    console.error('Claim dataset error:', error);
    throw error;
  }
}

/**
 * Collect proceeds from a listing
 * @param {string} listingId - Listing object ID
 * @param {Object} walletApi - Connected wallet API
 * @returns {Promise<{digest: string}>}
 */
export async function collectProceeds(listingId, walletApi) {
  try {
    const tx = new Transaction();
    
    // Call collect_proceeds function
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::collect_proceeds`,
      arguments: [
        tx.object(listingId)
      ],
    });
    
    const result = await walletApi.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true
      },
    });
    
    if (result.effects?.status?.status !== 'success') {
      throw new Error('Transaction failed: ' + result.effects?.status?.error);
    }
    
    return {
      digest: result.digest
    };
  } catch (error) {
    console.error('Collect proceeds error:', error);
    throw error;
  }
}

/**
 * Get all listings from blockchain events
 * @returns {Promise<Array>}
 */
export async function getAllListings() {
  try {
    const client = getSuiClient();
    
    // Query ListingCreated events
    const events = await client.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::ListingCreated`
      },
      limit: 100,
      order: 'descending'
    });
    
    // For each listing, get the object details
    const listings = await Promise.all(
      events.data.map(async (event) => {
        const listingId = event.parsedJson.listing_id;
        
        try {
          const obj = await client.getObject({
            id: listingId,
            options: {
              showContent: true,
              showOwner: true
            }
          });
          
          if (obj.data?.content?.dataType === 'moveObject') {
            const fields = obj.data.content.fields;
            return {
              id: listingId,
              seller: fields.seller,
              price: parseInt(fields.price) / 1_000_000_000, // Convert MIST to SUI
              sold: fields.sold,
              dataset: fields.dataset,
              balance: fields.balance,
              owner: obj.data.owner
            };
          }
        } catch (error) {
          console.error('Error fetching listing:', listingId, error);
        }
        
        return null;
      })
    );
    
    return listings.filter(l => l !== null);
  } catch (error) {
    console.error('Get all listings error:', error);
    return [];
  }
}
