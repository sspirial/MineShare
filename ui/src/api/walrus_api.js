/**
 * Walrus API - Upload and download encrypted data to/from Walrus decentralized storage
 */

import { CONFIG } from '../config.js';

// Walrus endpoints from shared config
const WALRUS_PUBLISHER = CONFIG.WALRUS_PUBLISHER;
const WALRUS_AGGREGATOR = CONFIG.WALRUS_AGGREGATOR;

/**
 * Simple XOR encryption for demo purposes
 * In production, use proper encryption like AES-GCM
 */
function encryptData(dataString, key) {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(dataString);
  const keyBytes = encoder.encode(key);
  
  const encrypted = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return encrypted;
}

/**
 * Decrypt XOR encrypted data
 */
function decryptData(encryptedBytes, key) {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  
  const decrypted = new Uint8Array(encryptedBytes.length);
  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Upload encrypted data to Walrus
 * @param {Object} data - The data object to encrypt and upload
 * @param {string} encryptionKey - Key for encryption
 * @returns {Promise<{blobId: string, encryptionKey: string}>}
 */
export async function uploadToWalrus(data, encryptionKey = null) {
  try {
    // Generate encryption key if not provided
    const key = encryptionKey || generateEncryptionKey();
    
    // Serialize and encrypt data
    const dataString = JSON.stringify(data);
    const encryptedData = encryptData(dataString, key);
    
    // Upload to Walrus
    const response = await fetch(`${WALRUS_PUBLISHER}/v1/store`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: encryptedData
    });
    
    if (!response.ok) {
      throw new Error(`Walrus upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // The blob ID is in different formats depending on response
    // Handle both newlyCreated and alreadyCertified cases
    let blobId;
    if (result.newlyCreated) {
      blobId = result.newlyCreated.blobObject.blobId;
    } else if (result.alreadyCertified) {
      blobId = result.alreadyCertified.blobId;
    } else {
      throw new Error('Unexpected Walrus response format');
    }
    
    return {
      blobId,
      encryptionKey: key,
      size: encryptedData.length
    };
  } catch (error) {
    console.error('Walrus upload error:', error);
    throw error;
  }
}

/**
 * Download and decrypt data from Walrus
 * @param {string} blobId - The Walrus blob ID
 * @param {string} encryptionKey - Key for decryption
 * @returns {Promise<Object>}
 */
export async function downloadFromWalrus(blobId, encryptionKey) {
  try {
    // Download from Walrus
    const response = await fetch(`${WALRUS_AGGREGATOR}/v1/${blobId}`);
    
    if (!response.ok) {
      throw new Error(`Walrus download failed: ${response.statusText}`);
    }
    
    const encryptedData = new Uint8Array(await response.arrayBuffer());
    
    // Decrypt
    const decryptedString = decryptData(encryptedData, encryptionKey);
    
    // Parse JSON
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Walrus download error:', error);
    throw error;
  }
}

/**
 * Generate a random encryption key
 */
function generateEncryptionKey() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert blob ID to CID bytes for smart contract
 * Walrus blob IDs are already in a format we can use
 */
export function blobIdToBytes(blobId) {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(blobId));
}

/**
 * Convert CID bytes from smart contract back to blob ID
 */
export function bytesToBlobId(cidBytes) {
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(cidBytes));
}
