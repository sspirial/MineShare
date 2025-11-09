/**
 * Walrus Blockchain Integration Service (MVP)
 *
 * Purpose:
 * - Provide a thin, configurable adapter to register dataset commitments
 *   and purchases on the Walrus network without requiring a bundler.
 * - Uses fetch to a user-provided HTTP endpoint (proxy or node) and
 *   gracefully degrades to local simulation when disabled or misconfigured.
 *
 * Notes:
 * - This file intentionally avoids importing npm modules to work in MV3.
 * - If you later add a bundler, you can swap implementations to use
 *   @mysten/walrus directly.
 */

const WALRUS_CONFIG_KEY = 'walrus_config_v1';

class WalrusService {
  constructor() {
    this._config = null;
    this._ready = this._loadConfig();
  }

  async _loadConfig() {
    try {
      const s = await chrome.storage.local.get([WALRUS_CONFIG_KEY]);
      this._config = s[WALRUS_CONFIG_KEY] || {
        enabled: false,
        baseUrl: '', // e.g., https://api.walrus.network (user-provided)
        apiKey: '',
        network: 'testnet'
      };
      // persist defaults if not present
      if (!s[WALRUS_CONFIG_KEY]) {
        await chrome.storage.local.set({ [WALRUS_CONFIG_KEY]: this._config });
      }
    } catch (e) {
      console.warn('Walrus: failed to load config', e);
      this._config = { enabled: false, baseUrl: '', apiKey: '', network: 'testnet' };
    }
  }

  async getConfig() {
    await this._ready;
    return { ...this._config };
  }

  async saveConfig(cfg) {
    this._config = { ...this._config, ...cfg };
    await chrome.storage.local.set({ [WALRUS_CONFIG_KEY]: this._config });
    return { success: true };
  }

  async isEnabled() {
    await this._ready;
    return !!(this._config && this._config.enabled && this._config.baseUrl);
  }

  // Attempt a basic HEAD/GET to verify connectivity
  async testConnection() {
    await this._ready;
    if (!this._config.baseUrl) return { success: false, error: 'No base URL configured' };
    try {
      const url = this._config.baseUrl.replace(/\/$/, '');
      const res = await fetch(url, { method: 'HEAD', mode: 'cors' }).catch(() => null);
      if (res && (res.ok || res.type === 'opaque')) return { success: true };
      // Fallback to GET /health
      const health = await fetch(url + '/health', { method: 'GET', mode: 'cors' }).catch(() => null);
      if (health && health.ok) return { success: true };
      return { success: false, error: 'Endpoint not reachable or CORS blocked' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  // Compute SHA-256 hash of an object (deterministic JSON)
  async hashObject(obj) {
    const stable = this._stableStringify(obj);
    const enc = new TextEncoder();
    const data = enc.encode(stable);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    return '0x' + hex;
  }

  _stableStringify(value) {
    // Stable stringify: sort object keys and ensure arrays are preserved
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(v => this._stableStringify(v)).join(',') + ']';
    const keys = Object.keys(value).sort();
    const parts = keys.map(k => '"' + k + '":' + this._stableStringify(value[k]));
    return '{' + parts.join(',') + '}';
  }

  // Create a Walrus commitment for a listing: records a content hash and metadata on-chain or via API
  async commitListing({ listing, dataHash, metadata }) {
    await this._ready;
    const enabled = await this.isEnabled();
    const payload = {
      listingId: listing.id,
      seller: listing.sellerId,
      price: listing.price,
      dataHash,
      meta: metadata || { title: listing.title, type: listing.dataType, size: listing.dataSize, range: listing.timeRange }
    };

    if (!enabled) {
      // Local simulation
      const commitmentCid = 'walrus-sim-' + Math.random().toString(36).slice(2);
      const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      return { success: true, commitmentCid, txHash, endpoint: null };
    }

    const base = this._config.baseUrl.replace(/\/$/, '');
    try {
      const res = await fetch(base + '/v1/commit', {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(payload),
        mode: 'cors'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json().catch(() => ({}));
      return {
        success: true,
        commitmentCid: json.commitmentCid || json.cid || json.id || null,
        txHash: json.txHash || json.tx || null,
        endpoint: base
      };
    } catch (e) {
      console.warn('Walrus commit failed, falling back to simulation:', e);
      const commitmentCid = 'walrus-sim-' + Math.random().toString(36).slice(2);
      const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      return { success: true, commitmentCid, txHash, endpoint: base, simulated: true, warning: String(e) };
    }
  }

  // Record a purchase on Walrus (optional)
  async recordPurchase({ listingId, buyer, price, txHint }) {
    await this._ready;
    const enabled = await this.isEnabled();
    const payload = { listingId, buyer, price, txHint };

    if (!enabled) {
      return { success: true, receiptId: 'walrus-receipt-sim-' + Math.random().toString(36).slice(2) };
    }

    const base = this._config.baseUrl.replace(/\/$/, '');
    try {
      const res = await fetch(base + '/v1/purchase', {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(payload),
        mode: 'cors'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json().catch(() => ({}));
      return { success: true, receiptId: json.receiptId || json.id || null, endpoint: base };
    } catch (e) {
      console.warn('Walrus purchase record failed, simulating:', e);
      return { success: true, receiptId: 'walrus-receipt-sim-' + Math.random().toString(36).slice(2), simulated: true, warning: String(e) };
    }
  }

  _headers() {
    const h = { 'content-type': 'application/json' };
    if (this._config.apiKey) h['authorization'] = 'Bearer ' + this._config.apiKey;
    return h;
  }
}

// Expose globally for other modules
window.WalrusAPI = new WalrusService();
console.log('Walrus Service initialized');
