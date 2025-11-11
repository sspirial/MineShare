// Background service worker: activity collector and export API
// Collects allowed, non-sensitive browsing activity and stores events in chrome.storage.local.
// It never collects input field values, keystrokes, clipboard, or any identifying fingerprints.

const CONFIG = {
  enabled: {
    urls: true,
    titles: true,
    timeOnPage: true,
    interactions: true,
    referrers: true,
    sessions: true,
    categories: true,
    metadata: true,
    keywords: true
  },
  // storage key used in chrome.storage.local
  storageKey: 'activity_events_v1',
  // number of top keywords to keep per page
  topKeywords: 10
};

// Preferences are stored under 'collector_prefs'. They allow user to turn off collection
// or toggle categories. PREFS will be loaded from chrome.storage.local on startup and
// updated via storage.onChanged.
let PREFS = { global: true, enabled: Object.assign({}, CONFIG.enabled) };

async function loadPrefs() {
  try {
    const stored = await chrome.storage.local.get(['collector_prefs']);
    if (stored && stored.collector_prefs) {
      PREFS = Object.assign({ global: true, enabled: Object.assign({}, CONFIG.enabled) }, stored.collector_prefs);
    } else {
      // write defaults back so UI can read them
      await chrome.storage.local.set({collector_prefs: PREFS});
    }
  } catch (e) {
    console.warn('Failed to load prefs', e);
  }
}

// helper to check whether a given category is enabled (checks PREFS then falls back to CONFIG)
function isEnabled(key) {
  try {
    if (PREFS && PREFS.enabled && typeof PREFS.enabled[key] !== 'undefined') return PREFS.enabled[key];
  } catch (e) {}
  return CONFIG.enabled[key];
}

function collectionEnabled() {
  return PREFS && typeof PREFS.global !== 'undefined' ? !!PREFS.global : true;
}

// load prefs on startup
loadPrefs();

// react to prefs changes (e.g., from popup)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.collector_prefs && changes.collector_prefs.newValue) {
    PREFS = Object.assign({ global: true, enabled: Object.assign({}, CONFIG.enabled) }, changes.collector_prefs.newValue);
    console.log('Collector prefs updated', PREFS);
  }
});

// In-memory maps for per-tab session tracking (non-persistent)
const tabSessions = new Map(); // tabId -> {sessionId, startTs, lastActiveTs, totalTime}

// Utility: safe domain extraction
function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch (e) {
    return null;
  }
}

// Utility: SHA-256 hashing of a string, returns hex
async function hashStringHex(input) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Storage helpers
async function appendEvent(event) {
  try {
    // Respect global collection preference
    if (!collectionEnabled()) return;

    // sanitize event according to per-category prefs
    const ev = sanitizeEventForPrefs(event);
    if (!ev) return; // nothing to store

    const store = await chrome.storage.local.get([CONFIG.storageKey]);
    const arr = store[CONFIG.storageKey] || [];
    arr.push(ev);
    const payload = {};
    payload[CONFIG.storageKey] = arr;
    await chrome.storage.local.set(payload);
  } catch (err) {
    console.error('Failed to append event', err);
  }
}

function sanitizeEventForPrefs(event) {
  if (!event || typeof event !== 'object') return null;
  const e = Object.assign({}, event);

  // Remove URL/hash if urls collection disabled
  if (!isEnabled('urls')) {
    delete e.url_hash;
  }
  // Remove title if titles disabled
  if (!isEnabled('titles')) {
    delete e.title;
  }
  // Remove dwell/time fields if timeOnPage disabled
  if (!isEnabled('timeOnPage')) {
    if (e.type === 'dwell' && typeof e.duration_ms !== 'undefined') delete e.duration_ms;
    if (typeof e.duration_ms !== 'undefined') delete e.duration_ms;
  }
  // Remove interaction details if interactions disabled
  if (!isEnabled('interactions')) {
    if (e.type === 'interaction') return null;
    delete e.interactionType;
    delete e.descriptor;
  }
  // Remove keywords if disabled
  if (!isEnabled('keywords')) {
    delete e.keywords;
  }
  // categories and sessions
  if (!isEnabled('categories')) delete e.category;
  if (!isEnabled('sessions')) delete e.sessionId;
  // metadata
  if (!isEnabled('metadata')) delete e.meta;

  // if after sanitization event has no useful keys, drop it
  const keys = Object.keys(e).filter(k => k !== 'ts' && k !== 'tabId');
  if (keys.length === 0) return null;
  return e;
}

async function getAllEvents() {
  const store = await chrome.storage.local.get([CONFIG.storageKey]);
  return store[CONFIG.storageKey] || [];
}

// Lightweight URL category classifier (best-effort, privacy-preserving)
function classifyUrlByKeyword(url, domain) {
  if (!url && !domain) return 'other';
  const u = (url || '').toLowerCase();
  const d = (domain || '').toLowerCase();
  const mapping = [
    {k: ['news', 'article', 'rss'], c: 'news'},
    {k: ['shop', 'cart', 'checkout', 'product', 'store'], c: 'shopping'},
    {k: ['facebook', 'twitter', 'instagram', 'tiktok', 'linkedin'], c: 'social'},
    {k: ['youtube', 'vimeo', 'stream', 'player'], c: 'video'},
    {k: ['search', 'google.com', 'bing.com', 'duckduckgo.com'], c: 'search'},
    {k: ['docs', 'wikipedia', 'wiki', 'readthedocs', 'mozilla'], c: 'reference'},
    {k: ['mail', 'inbox', 'outlook', 'gmail'], c: 'communication'},
    {k: ['forum', 'reddit', 'stack'], c: 'forum'}
  ];
  for (const m of mapping) {
    for (const kw of m.k) {
      if (u.includes(kw) || d.includes(kw)) return m.c;
    }
  }
  return 'other';
}

// Register navigation listener
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only consider top-level navigations
  if (details.frameId !== 0) return;
  const tabId = details.tabId;
  const url = details.url || '';
  const domain = extractDomain(url);

  // initialize or update session for this tab
  const now = Date.now();
  let sess = tabSessions.get(tabId);
  if (!sess) {
    sess = {sessionId: `${tabId}-${now}`, startTs: now, lastActiveTs: now, totalTime: 0};
    tabSessions.set(tabId, sess);
  } else {
    // treat navigation as continuation of session; update lastActive
    sess.lastActiveTs = now;
  }

  // get title from tabs API if available (may be blank until load)
  let title = '';
  try {
    const t = await chrome.tabs.get(tabId);
    title = t && t.title ? t.title : '';
  } catch (e) {
    // ignore
  }

  // Hash URL before storage
  const hashed = await hashStringHex(url);

  const event = {
    type: 'navigation',
    ts: now,
    tabId,
    domain,
    title: CONFIG.enabled.titles ? title : undefined,
    url_hash: CONFIG.enabled.urls ? hashed : undefined,
    referrer: CONFIG.enabled.referrers ? (details && details.transitionQualifiers ? details.transitionQualifiers.join(',') : undefined) : undefined,
    sessionId: CONFIG.enabled.sessions ? sess.sessionId : undefined,
    category: CONFIG.enabled.categories ? classifyUrlByKeyword(url, domain) : undefined
  };

  await appendEvent(event);
});

// track completed loads to note page load times (optional)
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const tabId = details.tabId;
  const now = Date.now();
  const url = details.url || '';
  const domain = extractDomain(url);
  const hashed = await hashStringHex(url);
  const event = {
    type: 'load',
    ts: now,
    tabId,
    domain,
    url_hash: CONFIG.enabled.urls ? hashed : undefined
  };
  await appendEvent(event);
});

// Tabs updated for title changes and to detect when a tab is removed (session end)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.title && CONFIG.enabled.titles) {
      const now = Date.now();
      const url = tab && tab.url ? tab.url : '';
      const hashed = await hashStringHex(url);
      await appendEvent({type: 'title', ts: now, tabId, title: changeInfo.title, domain: extractDomain(url), url_hash: CONFIG.enabled.urls ? hashed : undefined});
    }
  } catch (e) {
    console.warn('onUpdated error', e);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // finalize any session tracking
  const now = Date.now();
  const sess = tabSessions.get(tabId);
  if (sess) {
    // write a session_end event
    await appendEvent({type: 'session_end', ts: now, tabId, sessionId: sess.sessionId, duration_ms: now - sess.startTs});
    tabSessions.delete(tabId);
  }
});

// Message API: accept activity events from content scripts and expose export endpoints
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (!message || !message.type) return;

    if (message.type === 'get_pending_export') {
      // Content script requesting export data for dApp
      console.log('[MineShare Background] get_pending_export request from tab:', sender?.tab?.id);
      
      try {
        const tabId = sender?.tab?.id;
        if (tabId) {
          // First try tab-specific export
          const tabKey = `pending_export_tab_${tabId}`;
          console.log('[MineShare Background] Checking for tab-specific export:', tabKey);
          const tabData = await chrome.storage.local.get([tabKey]);
          
          if (tabData[tabKey]) {
            console.log('[MineShare Background] ✅ Found tab-specific export data');
            sendResponse({ok: true, data: tabData[tabKey]});
            // Clean up tab-specific data
            await chrome.storage.local.remove([tabKey]);
            return;
          }
        }
        
        // Fallback to general pending export
        console.log('[MineShare Background] Checking general pending_export');
        const data = await chrome.storage.local.get(['pending_export', 'export_timestamp']);
        
        if (data.pending_export && data.export_timestamp) {
          const age = Date.now() - data.export_timestamp;
          console.log('[MineShare Background] Found pending export, age:', age, 'ms');
          
          if (age < 5 * 60 * 1000) { // 5 minutes validity
            console.log('[MineShare Background] ✅ Sending pending export data');
            sendResponse({ok: true, data: data.pending_export});
            return;
          } else {
            console.warn('[MineShare Background] Export data expired');
          }
        } else {
          console.log('[MineShare Background] No pending export found');
        }
        
        sendResponse({ok: false, error: 'No pending export data'});
      } catch (e) {
        console.error('[MineShare Background] Failed to get pending export:', e);
        sendResponse({ok: false, error: String(e)});
      }
      return;
    }

    if (message.type === 'activity_event') {
      // message must include: event (object) and sender.tab.url
      const now = Date.now();
      const tab = sender && sender.tab ? sender.tab : null;
      const url = tab && tab.url ? tab.url : '';
      const domain = extractDomain(url);
      const hashed = await hashStringHex(url);

      const event = Object.assign({}, message.event, {
        ts: now,
        tabId: tab ? tab.id : undefined,
        domain,
        url_hash: CONFIG.enabled.urls ? hashed : undefined,
        sessionId: tab && tab.id && CONFIG.enabled.sessions && tabSessions.get(tab.id) ? tabSessions.get(tab.id).sessionId : undefined
      });

      // attach coarse metadata if requested (language/screen sent from content script)
      if (CONFIG.enabled.metadata && message.meta) {
        const meta = {};
        if (message.meta.language) meta.language = message.meta.language;
        if (message.meta.screen) meta.screen = message.meta.screen;
        // platform info available via runtime API
        try {
          const p = await chrome.runtime.getPlatformInfo();
          meta.os = p && p.os ? p.os : undefined;
        } catch (e) {}
        event.meta = meta;
      }

      await appendEvent(event);
      sendResponse({ok: true});
      return;
    }

    if (message.type === 'get_aggregated') {
      // Return aggregated/anonymized data via helper
      const events = await getAllEvents();
      // lazy-load data_api functions
      try {
        // data_api is loaded by importScripts at top if present, else implement inline aggregator
        const aggregated = await (typeof getAggregatedData === 'function' ? getAggregatedData(events, CONFIG) : inlineAggregate(events, CONFIG));
        sendResponse({ok: true, aggregated});
      } catch (e) {
        console.error('Aggregation failed', e);
        sendResponse({ok: false, error: String(e)});
      }
      return;
    }

    if (message.type === 'export_raw') {
      // Return raw events but with url_hash only (no plain URLs).
      const events = await getAllEvents();
      sendResponse({ok: true, events});
      return;
    }
  })();
  // indicate we'll call sendResponse asynchronously
  return true;
});

// Simple inline aggregator fallback (used if helper module not available)
function inlineAggregate(events, cfg) {
  const byDomain = {};
  for (const e of events) {
    const d = e.domain || 'unknown';
    if (!byDomain[d]) byDomain[d] = {visit_count: 0, total_time_ms: 0, click_count: 0, keywords: {}, categories: {}};
    const bucket = byDomain[d];
    if (e.type === 'navigation' || e.type === 'load' || e.type === 'title') bucket.visit_count++;
    if (e.type === 'dwell' && typeof e.duration_ms === 'number') bucket.total_time_ms += e.duration_ms;
    if (e.type === 'interaction' && e.interactionType === 'click') bucket.click_count++;
    if (e.keywords && Array.isArray(e.keywords)) {
      for (const kw of e.keywords) {
        bucket.keywords[kw] = (bucket.keywords[kw] || 0) + 1;
      }
    }
    if (e.category) {
      bucket.categories[e.category] = (bucket.categories[e.category] || 0) + 1;
    }
  }

  // convert keywords map to top keywords
  for (const d of Object.keys(byDomain)) {
    const b = byDomain[d];
    const kwPairs = Object.entries(b.keywords).sort((a, b2) => b2[1] - a[1]).slice(0, cfg.topKeywords || 10);
    b.topKeywords = kwPairs.map(p => ({keyword: p[0], count: p[1]}));
    delete b.keywords;
  }
  return {byDomain};
}

// Try to load helper module if present in extension
try {
  // importScripts is available in worker; this will define getAggregatedData if data_api.js provides it
  importScripts('api/data_api.js');
} catch (e) {
  // not fatal; inlineAggregate will be used
}

// lifecycle logging
self.addEventListener('install', () => console.log('Activity collector installed'));
self.addEventListener('activate', () => console.log('Activity collector activated'));
