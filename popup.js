/**
 * Popup UI Controller - Integrates Data Collection + Marketplace
 * Handles all UI interactions for the extension popup
 */

// ============================================================================
// INITIALIZATION
// ============================================================================

let currentTab = 'collection';
let currentUserId = null; // In production, derive from wallet address
let activeFilter = 'all';
let currentPurchaseListing = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
  setupEventListeners();
  await loadInitialData();
});

async function initializeApp() {
  // Check wallet status
  const walletStatus = await window.MarketplaceAPI.wallet.getStatus();
  if (walletStatus.connected) {
    currentUserId = walletStatus.address;
    updateWalletUI(true, walletStatus.address);
  }
  
  // Load collection preferences
  await loadPrefs();
}

// ============================================================================
// TAB NAVIGATION
// ============================================================================

function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
  });

  // Collection Tab
  setupCollectionListeners();
  
  // Listings Tab
  setupListingsListeners();
  
  // Marketplace Tab
  setupMarketplaceListeners();
  
  // Modals
  setupModalListeners();
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
  
  // Load tab-specific data
  loadTabData(tabName);
}

async function loadTabData(tabName) {
  if (tabName === 'listings') {
    await loadMyListings();
  } else if (tabName === 'marketplace') {
    await loadMarketplaceListings();
  } else if (tabName === 'collection') {
    refreshStorageInfo();
    refreshDomainList();
  }
}

// ============================================================================
// COLLECTION TAB (Original Functionality)
// ============================================================================

function setupCollectionListeners() {
  // Overlay toggle (original feature)
  document.getElementById('toggle').addEventListener('click', async () => {
    try {
      const tab = await getActiveTab();
      if (!tab) return;
      const res = await chrome.tabs.sendMessage(tab.id, {type: 'toggle-overlay'});
      document.getElementById('status').textContent = (res && res.visible) ? 'ON' : 'OFF';
    } catch (err) {
      console.error('Failed to toggle overlay', err);
      document.getElementById('status').textContent = 'error';
    }
  });

  // Wallet connection
  document.getElementById('connect-wallet').addEventListener('click', async () => {
    const btn = document.getElementById('connect-wallet');
    btn.disabled = true;
    btn.textContent = 'Connecting...';
    
    const result = await window.MarketplaceAPI.wallet.connect();
    
    if (result.success) {
      currentUserId = result.address;
      updateWalletUI(true, result.address);
      showStatus('success', 'Wallet connected successfully!');
    } else {
      showStatus('error', `Connection failed: ${result.error}`);
      btn.disabled = false;
      btn.textContent = 'Connect';
    }
  });

  // Save preferences
  document.getElementById('save-prefs').addEventListener('click', async () => {
    const inputs = document.querySelectorAll('#prefs-categories input[data-key]');
    const enabled = {};
    inputs.forEach(i => { enabled[i.dataset.key] = !!i.checked; });
    const prefs = { global: !!document.getElementById('pref-global').checked, enabled };
    
    await chrome.storage.local.set({collector_prefs: prefs});
    showStatus('success', 'Settings saved successfully');
  });

  // Clear data
  document.getElementById('clear-data').addEventListener('click', async () => {
    if (!confirm('Clear all collected activity data? This cannot be undone.')) return;
    
    await chrome.storage.local.remove(['activity_events_v1']);
    showStatus('success', 'Data cleared');
    refreshStorageInfo();
    refreshDomainList();
  });
}

async function loadPrefs() {
  const s = await chrome.storage.local.get(['collector_prefs']);
  let prefs = s.collector_prefs;
  
  if (!prefs) {
    prefs = { 
      global: true, 
      enabled: { 
        urls: true, titles: true, timeOnPage: true, interactions: true, 
        referrers: true, sessions: true, categories: true, metadata: true, keywords: true 
      } 
    };
    await chrome.storage.local.set({collector_prefs: prefs});
  }

  document.getElementById('pref-global').checked = !!prefs.global;
  
  const inputs = document.querySelectorAll('#prefs-categories input[data-key]');
  inputs.forEach(i => {
    i.checked = !!(prefs.enabled && prefs.enabled[i.dataset.key]);
  });
}

async function refreshStorageInfo() {
  chrome.storage.local.getBytesInUse(['activity_events_v1'], (bytes) => {
    const kb = (bytes/1024).toFixed(1);
    const count = document.getElementById('domain-list').childElementCount;
    document.getElementById('storage-info').textContent = `Storage: ${kb} KB • ${count} domains`;
  });
}

async function refreshDomainList() {
  const domainList = document.getElementById('domain-list');
  domainList.innerHTML = '';
  
  const s = await chrome.storage.local.get(['activity_events_v1']);
  const arr = s.activity_events_v1 || [];
  const counts = {};
  
  for (const e of arr) {
    const d = e.domain || 'unknown';
    counts[d] = (counts[d]||0)+1;
  }
  
  const keys = Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);
  
  if (keys.length === 0) {
    domainList.textContent = 'No collected events.';
    return;
  }
  
  for (const k of keys) {
    const row = document.createElement('div');
    const left = document.createElement('div');
    left.textContent = `${k} — ${counts[k]} events`;
    
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.style.fontSize = '11px';
    del.style.padding = '4px 8px';
    
    del.addEventListener('click', async () => {
      if (!confirm(`Delete all events for ${k}?`)) return;
      const newArr = arr.filter(ev=> (ev.domain||'unknown') !== k);
      await chrome.storage.local.set({activity_events_v1: newArr});
      showStatus('success', `Deleted ${counts[k]} events for ${k}`);
      refreshStorageInfo();
      refreshDomainList();
    });
    
    row.appendChild(left);
    row.appendChild(del);
    domainList.appendChild(row);
  }
}

// ============================================================================
// MY LISTINGS TAB
// ============================================================================

function setupListingsListeners() {
  document.getElementById('create-listing-btn').addEventListener('click', () => {
    openCreateListingModal();
  });
}

async function openCreateListingModal() {
  if (!currentUserId) {
    showStatus('error', 'Please connect your wallet first');
    switchTab('collection');
    return;
  }

  // Get collected data info
  const dataInfo = await window.MarketplaceAPI.dataHelper.getCollectedDataInfo();
  
  if (dataInfo.isEmpty) {
    showStatus('error', 'No data collected yet. Enable collection and browse some sites first.');
    return;
  }

  // Populate modal
  document.getElementById('listing-size').value = dataInfo.size;
  document.getElementById('listing-timerange').value = dataInfo.timeRange;
  document.getElementById('listing-title').value = '';
  document.getElementById('listing-description').value = '';
  document.getElementById('listing-price').value = '';
  
  document.getElementById('create-listing-modal').classList.add('active');
}

async function loadMyListings() {
  const container = document.getElementById('my-listings-container');
  container.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';
  
  if (!currentUserId) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔒</div><p>Connect your wallet to view listings</p></div>';
    return;
  }

  const listings = await window.MarketplaceAPI.listing.getMyListings(currentUserId);
  const transactions = await window.MarketplaceAPI.transaction.getTransactions(currentUserId);
  
  // Update stats
  const activeListings = listings.filter(l => l.status === 'listed').length;
  const soldListings = listings.filter(l => l.status === 'sold').length;
  const earnings = await window.MarketplaceAPI.transaction.getEarnings(currentUserId);
  
  document.getElementById('stat-active-listings').textContent = activeListings;
  document.getElementById('stat-sold-listings').textContent = soldListings;
  document.getElementById('stat-total-earnings').textContent = `$${earnings.toFixed(2)}`;
  
  // Render listings
  if (listings.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>No listings yet. Create your first listing!</p></div>';
    return;
  }
  
  container.innerHTML = '';
  listings.sort((a,b) => b.createdAt - a.createdAt).forEach(listing => {
    container.appendChild(createListingCard(listing, true));
  });
}

function createListingCard(listing, isOwn = false) {
  const card = document.createElement('div');
  card.className = 'card';
  
  const statusBadge = `<span class="badge ${listing.status}">${listing.status}</span>`;
  const date = new Date(listing.createdAt).toLocaleDateString();
  
  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${escapeHtml(listing.title)}</div>
      ${statusBadge}
    </div>
    <p style="font-size: 12px; color: var(--muted); margin: 4px 0 8px;">${escapeHtml(listing.description)}</p>
    <div class="card-meta">
      <div>📊 ${listing.dataType} • ${listing.dataSize} events</div>
      <div>📅 ${listing.timeRange}</div>
      <div>💰 Price: $${listing.price.toFixed(2)} • Created: ${date}</div>
    </div>
  `;
  
  if (isOwn && listing.status === 'listed') {
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete Listing';
    deleteBtn.className = 'danger';
    deleteBtn.style.fontSize = '12px';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Delete this listing?')) return;
      const result = await window.MarketplaceAPI.listing.deleteListing(listing.id);
      if (result.success) {
        showStatus('success', 'Listing deleted');
        loadMyListings();
      } else {
        showStatus('error', `Failed to delete: ${result.error}`);
      }
    });
    
    actions.appendChild(deleteBtn);
    card.appendChild(actions);
  }
  
  return card;
}

// ============================================================================
// MARKETPLACE TAB
// ============================================================================

function setupMarketplaceListeners() {
  // Filter chips
  document.querySelectorAll('#marketplace-filters .filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('#marketplace-filters .filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      activeFilter = e.target.dataset.filter;
      loadMarketplaceListings();
    });
  });

  // Search
  let searchTimeout;
  document.getElementById('search-marketplace').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadMarketplaceListings(), 300);
  });
}

async function loadMarketplaceListings() {
  const container = document.getElementById('marketplace-listings-container');
  container.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';
  
  let listings = await window.MarketplaceAPI.listing.getMarketplaceListings(currentUserId);
  
  // Apply filter
  if (activeFilter !== 'all') {
    listings = listings.filter(l => l.dataType === activeFilter);
  }
  
  // Apply search
  const searchTerm = document.getElementById('search-marketplace').value.toLowerCase();
  if (searchTerm) {
    listings = listings.filter(l => 
      l.title.toLowerCase().includes(searchTerm) || 
      l.description.toLowerCase().includes(searchTerm) ||
      l.sellerId.toLowerCase().includes(searchTerm)
    );
  }
  
  if (listings.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>No listings found</p></div>';
    return;
  }
  
  container.innerHTML = '';
  listings.sort((a,b) => b.createdAt - a.createdAt).forEach(listing => {
    container.appendChild(createMarketplaceCard(listing));
  });
}

function createMarketplaceCard(listing) {
  const card = document.createElement('div');
  card.className = 'card';
  
  const date = new Date(listing.createdAt).toLocaleDateString();
  const sellerId = listing.sellerId.substring(0, 10) + '...' + listing.sellerId.slice(-8);
  
  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${escapeHtml(listing.title)}</div>
      <div style="font-size: 16px; font-weight: 700; color: var(--primary);">$${listing.price.toFixed(2)}</div>
    </div>
    <p style="font-size: 12px; color: var(--muted); margin: 4px 0 8px;">${escapeHtml(listing.description)}</p>
    <div class="card-meta">
      <div>📊 ${listing.dataType} • ${listing.dataSize} events</div>
      <div>📅 ${listing.timeRange}</div>
      <div>👤 Seller: ${sellerId}</div>
    </div>
  `;
  
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  
  const buyBtn = document.createElement('button');
  buyBtn.textContent = '🛒 Buy Now';
  buyBtn.className = 'success';
  buyBtn.addEventListener('click', () => openPurchaseModal(listing));
  
  actions.appendChild(buyBtn);
  card.appendChild(actions);
  
  return card;
}

function openPurchaseModal(listing) {
  if (!currentUserId) {
    showStatus('error', 'Please connect your wallet first');
    switchTab('collection');
    return;
  }

  currentPurchaseListing = listing;
  
  const sellerId = listing.sellerId.substring(0, 10) + '...' + listing.sellerId.slice(-8);
  
  document.getElementById('purchase-details').innerHTML = `
    <div class="card">
      <h4 style="margin-top: 0;">${escapeHtml(listing.title)}</h4>
      <p style="font-size: 12px; color: var(--muted);">${escapeHtml(listing.description)}</p>
      <div style="margin-top: 12px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin: 6px 0;">
          <span>Data Type:</span>
          <strong>${listing.dataType}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 6px 0;">
          <span>Data Size:</span>
          <strong>${listing.dataSize} events</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 6px 0;">
          <span>Time Range:</span>
          <strong>${listing.timeRange}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 6px 0;">
          <span>Seller:</span>
          <strong>${sellerId}</strong>
        </div>
        <hr style="margin: 12px 0;">
        <div style="display: flex; justify-content: space-between; margin: 6px 0; font-size: 16px;">
          <span>Total Price:</span>
          <strong style="color: var(--primary);">$${listing.price.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('purchase-modal').classList.add('active');
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================

function setupModalListeners() {
  // Create Listing Modal
  document.getElementById('close-create-modal').addEventListener('click', closeCreateListingModal);
  document.getElementById('cancel-create-listing').addEventListener('click', closeCreateListingModal);
  
  document.getElementById('submit-create-listing').addEventListener('click', async () => {
    const btn = document.getElementById('submit-create-listing');
    btn.disabled = true;
    btn.textContent = 'Creating...';
    
    const listingData = {
      sellerId: currentUserId,
      title: document.getElementById('listing-title').value.trim(),
      description: document.getElementById('listing-description').value.trim(),
      dataType: document.getElementById('listing-data-type').value,
      dataSize: parseInt(document.getElementById('listing-size').value),
      price: parseFloat(document.getElementById('listing-price').value),
      timeRange: document.getElementById('listing-timerange').value
    };
    
    const result = await window.MarketplaceAPI.listing.createListing(listingData);
    
    if (result.success) {
      showModalStatus('create-listing-status', 'success', 'Listing created successfully!');
      setTimeout(() => {
        closeCreateListingModal();
        switchTab('listings');
        loadMyListings();
      }, 1500);
    } else {
      showModalStatus('create-listing-status', 'error', result.error);
      btn.disabled = false;
      btn.textContent = 'Create Listing';
    }
  });

  // Purchase Modal
  document.getElementById('close-purchase-modal').addEventListener('click', closePurchaseModal);
  document.getElementById('cancel-purchase').addEventListener('click', closePurchaseModal);
  
  document.getElementById('confirm-purchase').addEventListener('click', async () => {
    const btn = document.getElementById('confirm-purchase');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    
    showModalStatus('purchase-status', 'info', 'Signing transaction with wallet...');
    
    const result = await window.MarketplaceAPI.transaction.purchaseListing(
      currentPurchaseListing.id,
      currentUserId,
      window.MarketplaceAPI.wallet
    );
    
    if (result.success) {
      showModalStatus('purchase-status', 'success', `Purchase successful! Tx: ${result.transaction.txHash.substring(0, 20)}...`);
      setTimeout(() => {
        closePurchaseModal();
        loadMarketplaceListings();
      }, 2000);
    } else {
      showModalStatus('purchase-status', 'error', result.error);
      btn.disabled = false;
      btn.textContent = 'Confirm Purchase';
    }
  });
}

function closeCreateListingModal() {
  document.getElementById('create-listing-modal').classList.remove('active');
  document.getElementById('create-listing-status').style.display = 'none';
}

function closePurchaseModal() {
  document.getElementById('purchase-modal').classList.remove('active');
  document.getElementById('purchase-status').style.display = 'none';
  currentPurchaseListing = null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function getActiveTab() {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  return tabs[0];
}

function updateWalletUI(connected, address) {
  const statusEl = document.getElementById('wallet-status');
  const textEl = document.getElementById('wallet-text');
  const btnEl = document.getElementById('connect-wallet');
  
  if (connected) {
    statusEl.className = 'wallet-status connected';
    textEl.textContent = `Connected: ${address.substring(0, 6)}...${address.slice(-4)}`;
    btnEl.textContent = 'Disconnect';
    btnEl.onclick = async () => {
      await window.MarketplaceAPI.wallet.disconnect();
      currentUserId = null;
      updateWalletUI(false, null);
      showStatus('info', 'Wallet disconnected');
    };
  } else {
    statusEl.className = 'wallet-status disconnected';
    textEl.textContent = 'Wallet not connected';
    btnEl.textContent = 'Connect';
    btnEl.disabled = false;
  }
}

function showStatus(type, message) {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  const icon = icons[type] || '';
  const statusEl = document.getElementById('prefs-status');
  statusEl.className = `status-msg ${type}`;
  statusEl.textContent = `${icon} ${message}`;
  statusEl.style.display = 'block';
  setTimeout(() => statusEl.style.display = 'none', 3000);
}

function showModalStatus(elementId, type, message) {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  const icon = icons[type] || '';
  const statusEl = document.getElementById(elementId);
  statusEl.className = `status-msg ${type}`;
  statusEl.textContent = `${icon} ${message}`;
  statusEl.style.display = 'block';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadInitialData() {
  refreshStorageInfo();
  refreshDomainList();
  
  // Update overlay status
  try {
    const tab = await getActiveTab();
    if (tab) {
      const res = await chrome.tabs.sendMessage(tab.id, {type: 'get-overlay-state'});
      document.getElementById('status').textContent = (res && res.visible) ? 'ON' : 'OFF';
    }
  } catch (err) {
    document.getElementById('status').textContent = '—';
  }
}
