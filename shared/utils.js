/**
 * MineShare Shared Utilities
 * Common functions used across ui/ and dapp/
 */

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string|null} Domain or null if invalid
 */
export function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch (e) {
    return null;
  }
}

/**
 * Hash a string using SHA-256
 * @param {string} input - String to hash
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function hashStringHex(input) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size string
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

/**
 * Classify URL by keyword analysis
 * @param {string} url - URL to classify
 * @param {string} domain - Domain of the URL
 * @returns {string} Category name
 */
export function classifyUrlByKeyword(url, domain) {
  if (!url && !domain) return 'other';
  const u = (url || '').toLowerCase();
  const d = (domain || '').toLowerCase();
  
  const mapping = [
    { keywords: ['news', 'article', 'rss', 'blog'], category: 'news' },
    { keywords: ['shop', 'cart', 'checkout', 'product', 'store'], category: 'shopping' },
    { keywords: ['facebook', 'twitter', 'instagram', 'tiktok', 'linkedin'], category: 'social' },
    { keywords: ['youtube', 'vimeo', 'stream', 'player', 'video'], category: 'video' },
    { keywords: ['search', 'google.com', 'bing.com', 'duckduckgo.com'], category: 'search' },
    { keywords: ['docs', 'wikipedia', 'wiki', 'readthedocs', 'mozilla'], category: 'reference' },
    { keywords: ['mail', 'inbox', 'outlook', 'gmail'], category: 'communication' },
    { keywords: ['forum', 'reddit', 'stack'], category: 'forum' },
  ];
  
  for (const { keywords, category } of mapping) {
    for (const kw of keywords) {
      if (u.includes(kw) || d.includes(kw)) return category;
    }
  }
  
  return 'other';
}

/**
 * Truncate string to max length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
