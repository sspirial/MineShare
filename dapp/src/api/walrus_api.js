/**
 * Walrus API - Upload and download encrypted data to/from Walrus decentralized storage
 */

// Walrus endpoints (testnet)
// Note: Walrus testnet may have availability issues. For production, consider using mainnet
// or implementing a fallback storage solution
const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

// Alternative: You can also try using a local Walrus client or different publisher nodes
// Check https://docs.walrus.site for updated endpoints

// Number of epochs for storage (Walrus parameter)
const EPOCHS = 5; // Store for 5 epochs (~30 days on testnet)

// Enable mock mode for testing when Walrus testnet is unavailable
// TODO: Set to false once Walrus testnet is confirmed working
const MOCK_MODE = true; // Set to true to use mock storage for testing

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
    
    // Mock mode for testing when Walrus is unavailable
    if (MOCK_MODE) {
      console.warn('⚠️ Using MOCK mode for Walrus - data not actually uploaded!');
      const mockBlobId = 'mock_' + generateEncryptionKey().substring(0, 32);
      // Store in localStorage as fallback for testing
      localStorage.setItem(`walrus_mock_${mockBlobId}`, dataString);
      return {
        blobId: mockBlobId,
        encryptionKey: key,
        size: encryptedData.length
      };
    }
    
    console.log('Uploading to Walrus:', {
      publisher: WALRUS_PUBLISHER,
      dataSize: encryptedData.length,
      url: `${WALRUS_PUBLISHER}/v1/store?epochs=${EPOCHS}`
    });
    
    // Upload to Walrus - using PUT method with epochs parameter
    const response = await fetch(`${WALRUS_PUBLISHER}/v1/store?epochs=${EPOCHS}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: encryptedData
    });
    
    console.log('Walrus response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Unable to read error response';
      }
      console.error('Walrus error response:', errorText);
      
      // Provide more helpful error messages
      let errorMessage = `Walrus upload failed: ${response.status} ${response.statusText}`;
      if (response.status === 404) {
        errorMessage += '\n\nThe Walrus testnet publisher endpoint may be unavailable or the API version may have changed.\nPlease check https://docs.walrus.site for updated endpoints.';
      } else if (response.status === 403) {
        errorMessage += '\n\nAccess denied. You may need to set up proper authentication or use a different publisher node.';
      }
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('Walrus upload result:', result);
    
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
    // Mock mode for testing
    if (MOCK_MODE || blobId.startsWith('mock_')) {
      console.warn('⚠️ Using MOCK mode for Walrus download');
      const mockData = localStorage.getItem(`walrus_mock_${blobId}`);
      if (!mockData) {
        throw new Error('Mock data not found in localStorage');
      }
      return JSON.parse(mockData);
    }
    
    console.log('Downloading from Walrus:', {
      aggregator: WALRUS_AGGREGATOR,
      blobId,
      url: `${WALRUS_AGGREGATOR}/v1/${blobId}`
    });
    
    // Download from Walrus
    const response = await fetch(`${WALRUS_AGGREGATOR}/v1/${blobId}`);
    
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Unable to read error response';
      }
      console.error('Walrus download error response:', errorText);
      throw new Error(`Walrus download failed: ${response.status} ${response.statusText}`);
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
