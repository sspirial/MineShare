/**
 * Sui blockchain API for MineShare extension
 * Handles dataset minting and wallet interactions
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { CONFIG } from '../config.js';

// Contract configuration from shared config
export const PACKAGE_ID = CONFIG.PACKAGE_ID;
export const MODULE_NAME = CONFIG.MODULE_NAME;
export const NETWORK = CONFIG.NETWORK;

// Initialize Sui client with proper URL
export function getSuiClient() {
  return new SuiClient({ 
    url: getFullnodeUrl(NETWORK)
  });
}

/**
 * Mint a dataset NFT on Sui blockchain
 * @param {Array<number>} cidBytes - CID as byte array
 * @param {Object} metadata - Dataset metadata
 * @param {Function} signAndExecuteTransaction - Transaction signing function from dapp-kit
 * @returns {Promise<{digest: string, datasetId: string}>}
 */
export async function mintDataset(cidBytes, metadata, signAndExecuteTransaction) {
  try {
    const tx = new Transaction();
    
    // Encode metadata as JSON bytes
    const encoder = new TextEncoder();
    const metaBytes = Array.from(encoder.encode(JSON.stringify(metadata)));
    
    console.log('Building mint transaction:', {
      cidBytesLength: cidBytes.length,
      metaBytesLength: metaBytes.length,
      metadata
    });
    
    // Call mint_dataset function
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::mint_dataset`,
      arguments: [
        tx.pure.vector('u8', cidBytes),
        tx.pure.vector('u8', metaBytes)
      ],
    });
    
    console.log('Sending transaction to wallet for signing...');
    
    // Sign and execute transaction using dapp-kit
    const result = await signAndExecuteTransaction({
      transaction: tx,
    });
    
    console.log('Transaction submitted, digest:', result.digest);
    
    // Wait for transaction to be confirmed and fetch full result
    const client = getSuiClient();
    console.log('Waiting for transaction confirmation...');
    
    const txResult = await client.waitForTransaction({
      digest: result.digest,
      options: {
        showEffects: true,
        showObjectChanges: true,
      }
    });
    
    console.log('Mint transaction confirmed:', txResult);
    console.log('Mint transaction confirmed:', txResult);
    
    // Check if we got a valid result
    if (!txResult) {
      throw new Error('No result returned from transaction');
    }
    
    // Check for errors in the result
    if (txResult.errors && txResult.errors.length > 0) {
      console.error('Transaction errors:', txResult.errors);
      throw new Error('Transaction errors: ' + JSON.stringify(txResult.errors));
    }
    
    // Check effects status
    if (!txResult.effects) {
      console.error('No effects in result:', txResult);
      throw new Error('Transaction did not return effects. The transaction may have failed or timed out.');
    }
    
    if (txResult.effects?.status?.status !== 'success') {
      const error = txResult.effects?.status?.error || 'Unknown error';
      console.error('Transaction failed with status:', txResult.effects?.status);
      throw new Error('Transaction failed: ' + error);
    }
    
    // Extract created Dataset object ID
    const createdObjects = txResult.objectChanges?.filter(
      change => change.type === 'created' && change.objectType?.includes('Dataset')
    ) || [];
    
    console.log('Created objects:', createdObjects);
    
    const datasetId = createdObjects[0]?.objectId;
    
    if (!datasetId) {
      console.error('No dataset ID found in result:', txResult);
      throw new Error('Could not extract dataset ID from transaction result');
    }
    
    console.log('✅ Dataset minted successfully:', datasetId);
    
    return {
      digest: txResult.digest,
      datasetId: datasetId,
      effects: txResult.effects
    };
  } catch (error) {
    console.error('❌ Mint dataset error:', error);
    
    // Provide more helpful error messages
    if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
      throw new Error('Network error: Could not connect to Sui network. Please check your internet connection and try again.');
    } else if (error.message?.includes('Rejected') || error.message?.includes('rejected')) {
      throw new Error('Transaction rejected by user');
    } else if (error.message?.includes('Insufficient')) {
      throw new Error('Insufficient SUI balance to pay for transaction');
    }
    
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
 * @param {Function} signAndExecuteTransaction - Transaction signing function from dapp-kit
 * @returns {Promise<{digest: string, listingId: string}>}
 */
export async function createListing(datasetId, priceInSui, signAndExecuteTransaction) {
  try {
    const tx = new Transaction();
    
    // Convert SUI to MIST (1 SUI = 1_000_000_000 MIST)
    const priceInMist = Math.floor(priceInSui * 1_000_000_000);
    
    console.log('Building listing transaction:', {
      datasetId,
      priceInSui,
      priceInMist
    });
    
    // Call create_listing function
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::create_listing`,
      arguments: [
        tx.object(datasetId),
        tx.pure.u64(priceInMist)
      ],
    });
    
    console.log('Sending listing transaction to wallet...');
    
    const result = await signAndExecuteTransaction({
      transaction: tx,
    });
    
    console.log('Listing transaction submitted, digest:', result.digest);
    
    // Wait for transaction confirmation
    const client = getSuiClient();
    console.log('Waiting for listing transaction confirmation...');
    
    const txResult = await client.waitForTransaction({
      digest: result.digest,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true
      }
    });
    
    console.log('Listing transaction confirmed:', txResult);
    
    if (!txResult.effects) {
      console.error('No effects in listing result:', txResult);
      throw new Error('Listing transaction did not return effects.');
    }
    
    if (txResult.effects?.status?.status !== 'success') {
      const error = txResult.effects?.status?.error || 'Unknown error';
      console.error('Listing transaction failed:', txResult.effects?.status);
      throw new Error('Transaction failed: ' + error);
    }
    
    // Extract created Listing object ID
    const createdObjects = txResult.objectChanges?.filter(
      change => change.type === 'created' && change.objectType?.includes('Listing')
    ) || [];
    
    console.log('Created listing objects:', createdObjects);
    
    const listingId = createdObjects[0]?.objectId;
    
    if (!listingId) {
      console.error('No listing ID found in result:', txResult);
      throw new Error('Could not extract listing ID from transaction result');
    }
    
    console.log('✅ Listing created successfully:', listingId);
    
    return {
      digest: txResult.digest,
      listingId: listingId,
      events: txResult.events
    };
  } catch (error) {
    console.error('❌ Create listing error:', error);
    
    // Provide more helpful error messages
    if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
      throw new Error('Network error: Could not connect to Sui network. Please check your internet connection and try again.');
    } else if (error.message?.includes('Rejected') || error.message?.includes('rejected')) {
      throw new Error('Transaction rejected by user');
    } else if (error.message?.includes('Insufficient')) {
      throw new Error('Insufficient SUI balance to pay for transaction');
    }
    
    throw error;
  }
}

/**
 * Buy a listing
 * @param {string} listingId - Listing object ID
 * @param {number} priceInSui - Price in SUI
 * @param {Function} signAndExecuteTransaction - Transaction signing function from dapp-kit
 * @param {string} buyerAddress - Buyer's address
 * @returns {Promise<{digest: string}>}
 */
export async function buyListing(listingId, priceInSui, signAndExecuteTransaction, buyerAddress) {
  console.log('🛒 Starting buy listing transaction...');
  console.log('Listing ID:', listingId);
  console.log('Price:', priceInSui, 'SUI');
  console.log('Buyer:', buyerAddress);
  
  try {
    const client = getSuiClient();
    const tx = new Transaction();
    
    // Convert SUI to MIST
    const priceInMist = Math.floor(priceInSui * 1_000_000_000);
    console.log('Price in MIST:', priceInMist);
    
    // Get buyer's SUI coins
    const coins = await client.getCoins({
      owner: buyerAddress,
      coinType: '0x2::sui::SUI'
    });
    
    if (coins.data.length === 0) {
      throw new Error('No SUI coins found in wallet');
    }
    
    console.log('Found', coins.data.length, 'SUI coins');
    
    // Merge coins if needed and split exact amount
    const [primaryCoin, ...otherCoins] = coins.data;
    
    if (otherCoins.length > 0) {
      tx.mergeCoins(
        tx.object(primaryCoin.coinObjectId),
        otherCoins.map(coin => tx.object(coin.coinObjectId))
      );
      console.log('Merged', otherCoins.length, 'additional coins');
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
    
    // Transfer the purchased dataset NFT to buyer
    tx.transferObjects([result], tx.pure.address(buyerAddress));
    
    console.log('Transaction built, requesting signature...');
    
    const txResult = await signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true
      },
    });
    
    console.log('Transaction submitted:', txResult.digest);
    
    // Wait for transaction confirmation
    const txResponse = await client.waitForTransaction({
      digest: txResult.digest,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true
      }
    });
    
    console.log('Transaction confirmed:', txResponse);
    
    if (txResponse.effects?.status?.status !== 'success') {
      throw new Error('Transaction failed: ' + txResponse.effects?.status?.error);
    }
    
    console.log('✅ Purchase successful!');
    
    return {
      digest: txResponse.digest,
      events: txResponse.events,
      effects: txResponse.effects
    };
  } catch (error) {
    console.error('❌ Buy listing error:', error);
    throw error;
  }
}

/**
 * Claim dataset after purchase
 * @param {string} listingId - Listing object ID
 * @param {Function} signAndExecuteTransaction - Transaction signing function from dapp-kit
 * @param {string} buyerAddress - Buyer's address
 * @returns {Promise<{digest: string, datasetId: string}>}
 */
export async function claimDataset(listingId, signAndExecuteTransaction, buyerAddress) {
  console.log('📦 Starting claim dataset transaction...');
  console.log('Listing ID:', listingId);
  console.log('Buyer:', buyerAddress);
  
  try {
    const client = getSuiClient();
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
    
    console.log('Transaction built, requesting signature...');
    
    const txResult = await signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true
      },
    });
    
    console.log('Transaction submitted:', txResult.digest);
    
    // Wait for transaction confirmation
    const txResponse = await client.waitForTransaction({
      digest: txResult.digest,
      options: {
        showEffects: true,
        showObjectChanges: true
      }
    });
    
    console.log('Transaction confirmed:', txResponse);
    
    if (txResponse.effects?.status?.status !== 'success') {
      throw new Error('Transaction failed: ' + txResponse.effects?.status?.error);
    }
    
    // Extract transferred Dataset object ID
    const transferredObjects = txResponse.objectChanges?.filter(
      change => change.type === 'created' && change.objectType?.includes('Dataset')
    ) || [];
    
    const datasetId = transferredObjects[0]?.objectId;
    
    console.log('✅ Dataset claimed! Dataset ID:', datasetId);
    
    return {
      digest: txResponse.digest,
      datasetId: datasetId || null
    };
  } catch (error) {
    console.error('❌ Claim dataset error:', error);
    throw error;
  }
}

/**
 * Collect proceeds from a listing
 * @param {string} listingId - Listing object ID
 * @param {Function} signAndExecuteTransaction - Transaction signing function from dapp-kit
 * @returns {Promise<{digest: string}>}
 */
export async function collectProceeds(listingId, signAndExecuteTransaction) {
  console.log('💰 Starting collect proceeds transaction...');
  console.log('Listing ID:', listingId);
  
  try {
    const client = getSuiClient();
    const tx = new Transaction();
    
    // Call collect_proceeds function
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::collect_proceeds`,
      arguments: [
        tx.object(listingId)
      ],
    });
    
    console.log('Transaction built, requesting signature...');
    
    const txResult = await signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true
      },
    });
    
    console.log('Transaction submitted:', txResult.digest);
    
    // Wait for transaction confirmation
    const txResponse = await client.waitForTransaction({
      digest: txResult.digest,
      options: {
        showEffects: true
      }
    });
    
    console.log('Transaction confirmed:', txResponse);
    
    if (txResponse.effects?.status?.status !== 'success') {
      throw new Error('Transaction failed: ' + txResponse.effects?.status?.error);
    }
    
    console.log('✅ Proceeds collected!');
    
    return {
      digest: txResponse.digest
    };
  } catch (error) {
    console.error('❌ Collect proceeds error:', error);
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
