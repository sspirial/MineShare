/**
 * Options Page Controller - Full-screen marketplace interface
 */

let currentPage = 'dashboard';
let currentUserId = null;
let activeFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await init();
  setupNavigation();
  setupEventListeners();
  await loadDashboard();
});

async function init() {
  const walletStatus = await window.MarketplaceAPI.wallet.getStatus();
  if (walletStatus.connected) {
    currentUserId = walletStatus.address;
    updateWalletUI(true, walletStatus.address);
  }
}

// Navigation
function setupNavigation() {
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  
  // Update nav
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  
  // Update pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });
  
  // Load page data
  loadPageData(page);
}

async function loadPageData(page) {
  switch (page) {
    case 'dashboard':
      await loadDashboard();
      break;
    case 'marketplace':
      await loadMarketplace();
      break;
    case 'listings':
      await loadMyListings();
      break;
    case 'settings':
      await loadSettings();
      break;
  }
}

// Event Listeners
function setupEventListeners() {
  // Wallet
  document.getElementById('wallet-connect-btn').addEventListener('click', handleWalletToggle);
  
  // Quick actions
  document.getElementById('quick-create-listing').addEventListener('click', () => {
    if (!currentUserId) {
      alert('Please connect your wallet first');
      return;
    }
    navigateTo('listings');
    setTimeout(() => createListing(), 100);
  });
  
  document.getElementById('quick-browse').addEventListener('click', () => navigateTo('marketplace'));
  document.getElementById('quick-settings').addEventListener('click', () => navigateTo('settings'));
  
  // Marketplace
  document.getElementById('marketplace-search').addEventListener('input', debounce(loadMarketplace, 300));
  
  document.querySelectorAll('#marketplace-filters .filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('#marketplace-filters .filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      activeFilter = e.target.dataset.filter;
      loadMarketplace();
    });
  });
  
  // Listings
  document.getElementById('create-listing-btn').addEventListener('click', () => createListing());
  
  // Settings
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('clear-all-data').addEventListener('click', clearAllData);
}

// Wallet
async function handleWalletToggle() {
  const btn = document.getElementById('wallet-connect-btn');
  
  if (currentUserId) {
    // Disconnect
    await window.MarketplaceAPI.wallet.disconnect();
    currentUserId = null;
    updateWalletUI(false, null);
  } else {
    // Connect
    btn.disabled = true;
    btn.textContent = 'Connecting...';
    
    const result = await window.MarketplaceAPI.wallet.connect();
    
    if (result.success) {
      currentUserId = result.address;
      updateWalletUI(true, result.address);
      loadDashboard();
    } else {
      alert(`Connection failed: ${result.error}`);
      btn.disabled = false;
      btn.textContent = 'Connect Wallet';
    }
  }
}

function updateWalletUI(connected, address) {
  const infoEl = document.getElementById('wallet-info');
  const textEl = document.getElementById('wallet-status-text');
  const btnEl = document.getElementById('wallet-connect-btn');
  
  if (connected) {
    infoEl.classList.add('connected');
    textEl.textContent = `${address.substring(0, 6)}...${address.slice(-4)}`;
    btnEl.textContent = 'Disconnect';
    btnEl.disabled = false;
  } else {
    infoEl.classList.remove('connected');
    textEl.textContent = 'Not Connected';
    btnEl.textContent = 'Connect Wallet';
    btnEl.disabled = false;
  }
}

// Dashboard
async function loadDashboard() {
  // Get collected events
  const dataInfo = await window.MarketplaceAPI.dataHelper.getCollectedDataInfo();
  document.getElementById('dash-collected-events').textContent = dataInfo.size;
  
  if (currentUserId) {
    const listings = await window.MarketplaceAPI.listing.getMyListings(currentUserId);
    const active = listings.filter(l => l.status === 'listed').length;
    const sold = listings.filter(l => l.status === 'sold').length;
    const earnings = await window.MarketplaceAPI.transaction.getEarnings(currentUserId);
    
    document.getElementById('dash-active-listings').textContent = active;
    document.getElementById('dash-sold-listings').textContent = sold;
    document.getElementById('dash-total-earnings').textContent = `$${earnings.toFixed(2)}`;
  } else {
    document.getElementById('dash-active-listings').textContent = '—';
    document.getElementById('dash-sold-listings').textContent = '—';
    document.getElementById('dash-total-earnings').textContent = '—';
  }
}

// Marketplace
async function loadMarketplace() {
  const container = document.getElementById('marketplace-listings');
  container.innerHTML = '<div style="text-align: center; padding: 40px;">Loading...</div>';
  
  let listings = await window.MarketplaceAPI.listing.getMarketplaceListings(currentUserId);
  
  // Filter
  if (activeFilter !== 'all') {
    listings = listings.filter(l => l.dataType === activeFilter);
  }
  
  // Search
  const searchTerm = document.getElementById('marketplace-search').value.toLowerCase();
  if (searchTerm) {
    listings = listings.filter(l =>
      l.title.toLowerCase().includes(searchTerm) ||
      l.description.toLowerCase().includes(searchTerm)
    );
  }
  
  if (listings.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h2>No listings found</h2></div>';
    return;
  }
  
  container.innerHTML = '';
  listings.forEach(listing => {
    container.appendChild(createListingCard(listing, false));
  });
}

// My Listings
async function loadMyListings() {
  const container = document.getElementById('my-listings');
  
  if (!currentUserId) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><h2>Connect wallet to view listings</h2></div>';
    return;
  }
  
  container.innerHTML = '<div style="text-align: center; padding: 40px;">Loading...</div>';
  
  const listings = await window.MarketplaceAPI.listing.getMyListings(currentUserId);
  
  if (listings.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><h2>No listings yet</h2><p>Create your first listing to start earning!</p></div>';
    return;
  }
  
  container.innerHTML = '';
  listings.sort((a,b) => b.createdAt - a.createdAt).forEach(listing => {
    container.appendChild(createListingCard(listing, true));
  });
}

// Create Listing Card
function createListingCard(listing, isOwn) {
  const card = document.createElement('div');
  card.className = 'listing-card';
  
  const sellerId = listing.sellerId.substring(0, 8) + '...' + listing.sellerId.slice(-6);
  const date = new Date(listing.createdAt).toLocaleDateString();
  
  card.innerHTML = `
    <div class="listing-header">
      <div>
        <div class="listing-title">${escapeHtml(listing.title)}</div>
        ${isOwn ? `<span class="badge ${listing.status}">${listing.status}</span>` : ''}
      </div>
      <div class="listing-price">$${listing.price.toFixed(2)}</div>
    </div>
    <div class="listing-description">${escapeHtml(listing.description)}</div>
    <div class="listing-meta">📊 ${listing.dataType} • ${listing.dataSize} events</div>
    <div class="listing-meta">📅 ${listing.timeRange}</div>
    <div class="listing-meta">👤 ${isOwn ? 'You' : sellerId} • ${date}</div>
  `;
  
  const actions = document.createElement('div');
  actions.className = 'listing-actions';
  
  if (isOwn && listing.status === 'listed') {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'danger';
    deleteBtn.onclick = async () => {
      if (!confirm('Delete this listing?')) return;
      const result = await window.MarketplaceAPI.listing.deleteListing(listing.id);
      if (result.success) {
        alert('Listing deleted');
        loadMyListings();
        loadDashboard();
      }
    };
    actions.appendChild(deleteBtn);
  } else if (!isOwn) {
    const buyBtn = document.createElement('button');
    buyBtn.textContent = '🛒 Buy Now';
    buyBtn.className = 'success';
    buyBtn.onclick = () => purchaseListing(listing);
    actions.appendChild(buyBtn);
  }
  
  card.appendChild(actions);
  return card;
}

// Create Listing
async function createListing() {
  const dataInfo = await window.MarketplaceAPI.dataHelper.getCollectedDataInfo();
  
  if (dataInfo.isEmpty) {
    alert('No data collected yet. Enable collection and browse some sites first.');
    navigateTo('settings');
    return;
  }
  
  const title = prompt('Listing Title:', 'My Browsing Data');
  if (!title) return;
  
  const description = prompt('Description:', 'High-quality browsing data');
  if (!description) return;
  
  const price = parseFloat(prompt('Price (USD):', '5.00'));
  if (!price || price <= 0) return;
  
  const listingData = {
    sellerId: currentUserId,
    title,
    description,
    dataType: 'mixed',
    dataSize: dataInfo.size,
    price,
    timeRange: dataInfo.timeRange
  };
  
  const result = await window.MarketplaceAPI.listing.createListing(listingData);
  
  if (result.success) {
    alert('Listing created successfully!');
    loadMyListings();
    loadDashboard();
  } else {
    alert(`Failed to create listing: ${result.error}`);
  }
}

// Purchase Listing
async function purchaseListing(listing) {
  if (!currentUserId) {
    alert('Please connect your wallet first');
    return;
  }
  
  const confirm = window.confirm(
    `Purchase "${listing.title}" for $${listing.price.toFixed(2)}?\n\nThis will process a blockchain transaction.`
  );
  
  if (!confirm) return;
  
  const result = await window.MarketplaceAPI.transaction.purchaseListing(
    listing.id,
    currentUserId,
    window.MarketplaceAPI.wallet
  );
  
  if (result.success) {
    alert(`Purchase successful!\n\nTransaction: ${result.transaction.txHash.substring(0, 20)}...`);
    loadMarketplace();
    loadDashboard();
  } else {
    alert(`Purchase failed: ${result.error}`);
  }
}

// Settings
async function loadSettings() {
  const s = await chrome.storage.local.get(['collector_prefs']);
  let prefs = s.collector_prefs || {
    global: true,
    enabled: {
      urls: true, titles: true, timeOnPage: true, interactions: true,
      referrers: true, sessions: true, categories: true, metadata: true, keywords: true
    }
  };
  
  document.getElementById('settings-global').checked = prefs.global;
  
  const categoriesContainer = document.getElementById('settings-categories');
  categoriesContainer.innerHTML = '';
  
  const categories = [
    { key: 'urls', label: 'URLs (hashed)' },
    { key: 'titles', label: 'Page Titles' },
    { key: 'timeOnPage', label: 'Time on Pages' },
    { key: 'interactions', label: 'Click/Scroll' },
    { key: 'referrers', label: 'Referrers' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'categories', label: 'Page Categories' },
    { key: 'keywords', label: 'Keywords' }
  ];
  
  categories.forEach(cat => {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';
    label.style.fontSize = '15px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.key = cat.key;
    checkbox.checked = prefs.enabled[cat.key];
    checkbox.style.width = '18px';
    checkbox.style.height = '18px';
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(cat.label));
    categoriesContainer.appendChild(label);
  });
}

async function saveSettings() {
  const global = document.getElementById('settings-global').checked;
  const enabled = {};
  
  document.querySelectorAll('#settings-categories input').forEach(input => {
    enabled[input.dataset.key] = input.checked;
  });
  
  await chrome.storage.local.set({ collector_prefs: { global, enabled } });
  alert('Settings saved successfully!');
}

async function clearAllData() {
  if (!confirm('Clear ALL collected data? This cannot be undone.')) return;
  
  await chrome.storage.local.remove(['activity_events_v1']);
  alert('All data cleared');
  loadDashboard();
}

// Utilities
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
