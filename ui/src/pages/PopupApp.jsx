import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ListingCard from '../components/ListingCard';
import StatusMessage from '../components/StatusMessage';
import SplashScreen from '../components/SplashScreen';
import WalletConnect from '../components/WalletConnect';

const PopupApp = () => {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [currentTab, setCurrentTab] = useState('collection');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [statusMessage, setStatusMessage] = useState(null);
  
  // Collection state
  const [globalPref, setGlobalPref] = useState(true);
  const [categoryPrefs, setCategoryPrefs] = useState({});
  const [storageInfo, setStorageInfo] = useState('');
  const [domainList, setDomainList] = useState([]);
  
  // Listings state
  const [myListings, setMyListings] = useState([]);
  const [stats, setStats] = useState({ active: 0, sold: 0, earnings: 0 });
  
  // Marketplace state
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [createListingModal, setCreateListingModal] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [currentPurchaseListing, setCurrentPurchaseListing] = useState(null);
  
  // Create listing form
  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    dataType: 'browsing',
    size: 0,
    price: '',
    timeRange: ''
  });

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  // Load tab data when switching tabs
  useEffect(() => {
    loadTabData();
  }, [currentTab]);

  const initializeApp = async () => {
    // Check wallet status
    const walletStatus = await window.MarketplaceAPI.wallet.getStatus();
    if (walletStatus.connected) {
      setCurrentUserId(walletStatus.address);
    }
    
    // Load collection preferences
    await loadPrefs();
  };

  const loadTabData = async () => {
    if (currentTab === 'collection') {
      await refreshStorageInfo();
      await refreshDomainList();
    } else if (currentTab === 'listings') {
      await loadMyListingsData();
    } else if (currentTab === 'marketplace') {
      await loadMarketplaceData();
    }
  };

  const loadPrefs = async () => {
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

    setGlobalPref(!!prefs.global);
    setCategoryPrefs(prefs.enabled || {});
  };

  const handleConnectWallet = async () => {
    const result = await window.MarketplaceAPI.wallet.connect();
    
    if (result.success) {
      setCurrentUserId(result.address);
      showStatus('success', 'Wallet connected successfully!');
    } else {
      showStatus('error', `Connection failed: ${result.error}`);
    }
  };

  const handleDisconnectWallet = async () => {
    await window.MarketplaceAPI.wallet.disconnect();
    setCurrentUserId(null);
    showStatus('info', 'Wallet disconnected');
  };

  const handleSavePrefs = async () => {
    const prefs = { global: globalPref, enabled: categoryPrefs };
    await chrome.storage.local.set({collector_prefs: prefs});
    showStatus('success', 'Settings saved successfully');
  };

  const handleClearData = async () => {
    if (!confirm('Clear all collected activity data? This cannot be undone.')) return;
    
    await chrome.storage.local.remove(['activity_events_v1']);
    showStatus('success', 'Data cleared');
    await refreshStorageInfo();
    await refreshDomainList();
  };

  const refreshStorageInfo = async () => {
    chrome.storage.local.getBytesInUse(['activity_events_v1'], (bytes) => {
      const kb = (bytes/1024).toFixed(1);
      const count = domainList.length;
      setStorageInfo(`Storage: ${kb} KB • ${count} domains`);
    });
  };

  const refreshDomainList = async () => {
    const s = await chrome.storage.local.get(['activity_events_v1']);
    const arr = s.activity_events_v1 || [];
    const counts = {};
    
    for (const e of arr) {
      const d = e.domain || 'unknown';
      counts[d] = (counts[d]||0)+1;
    }
    
    const keys = Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);
    setDomainList(keys.map(k => ({ domain: k, count: counts[k] })));
  };

  const handleDeleteDomain = async (domain) => {
    if (!confirm(`Delete all events for ${domain}?`)) return;
    
    const s = await chrome.storage.local.get(['activity_events_v1']);
    const arr = s.activity_events_v1 || [];
    const newArr = arr.filter(ev=> (ev.domain||'unknown') !== domain);
    await chrome.storage.local.set({activity_events_v1: newArr});
    
    showStatus('success', `Deleted events for ${domain}`);
    await refreshStorageInfo();
    await refreshDomainList();
  };

  const loadMyListingsData = async () => {
    if (!currentUserId) return;

    const listings = await window.MarketplaceAPI.listing.getMyListings(currentUserId);
    setMyListings(listings);
    
    const activeListings = listings.filter(l => l.status === 'listed').length;
    const soldListings = listings.filter(l => l.status === 'sold').length;
    const earnings = await window.MarketplaceAPI.transaction.getEarnings(currentUserId);
    
    setStats({ active: activeListings, sold: soldListings, earnings });
  };

  const handleOpenCreateListing = async () => {
    if (!currentUserId) {
      showStatus('error', 'Please connect your wallet first');
      setCurrentTab('collection');
      return;
    }

    const dataInfo = await window.MarketplaceAPI.dataHelper.getCollectedDataInfo();
    
    if (dataInfo.isEmpty) {
      showStatus('error', 'No data collected yet. Enable collection and browse some sites first.');
      return;
    }

    setListingForm({
      title: '',
      description: '',
      dataType: 'browsing',
      size: dataInfo.size,
      price: '',
      timeRange: dataInfo.timeRange
    });
    
    setCreateListingModal(true);
  };

  const handleCreateListing = async () => {
    const listingData = {
      sellerId: currentUserId,
      title: listingForm.title.trim(),
      description: listingForm.description.trim(),
      dataType: listingForm.dataType,
      dataSize: listingForm.size,
      price: parseFloat(listingForm.price),
      timeRange: listingForm.timeRange
    };
    
    const result = await window.MarketplaceAPI.listing.createListing(listingData);
    
    if (result.success) {
      showStatus('success', 'Listing created successfully!');
      setCreateListingModal(false);
      setCurrentTab('listings');
      await loadMyListingsData();
    } else {
      showStatus('error', result.error);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Delete this listing?')) return;
    
    const result = await window.MarketplaceAPI.listing.deleteListing(listingId);
    if (result.success) {
      showStatus('success', 'Listing deleted');
      await loadMyListingsData();
    } else {
      showStatus('error', `Failed to delete: ${result.error}`);
    }
  };

  const loadMarketplaceData = async () => {
    let listings = await window.MarketplaceAPI.listing.getMarketplaceListings(currentUserId);
    
    // Apply filter
    if (activeFilter !== 'all') {
      listings = listings.filter(l => l.dataType === activeFilter);
    }
    
    // Apply search
    if (searchTerm) {
      listings = listings.filter(l => 
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.sellerId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setMarketplaceListings(listings);
  };

  const handleOpenPurchase = (listing) => {
    if (!currentUserId) {
      showStatus('error', 'Please connect your wallet first');
      setCurrentTab('collection');
      return;
    }

    setCurrentPurchaseListing(listing);
    setPurchaseModal(true);
  };

  const handlePurchase = async () => {
    const result = await window.MarketplaceAPI.transaction.purchaseListing(
      currentPurchaseListing.id,
      currentUserId,
      window.MarketplaceAPI.wallet
    );
    
    if (result.success) {
      showStatus('success', `Purchase successful! Tx: ${result.transaction.txHash.substring(0, 20)}...`);
      setPurchaseModal(false);
      await loadMarketplaceData();
    } else {
      showStatus('error', result.error);
    }
  };

  const showStatus = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleNext = () => {
    setIsSplashVisible(false);
  };

  const handleWalletConnected = (address) => {
    setCurrentUserId(address);
    loadPrefs();
    loadTabData();
  };

  const categories = [
    { key: 'urls', label: 'URLs (hashed)' },
    { key: 'titles', label: 'Page titles' },
    { key: 'timeOnPage', label: 'Time on pages' },
    { key: 'interactions', label: 'Click/scroll' },
    { key: 'referrers', label: 'Referrers' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'categories', label: 'Categories' },
    { key: 'keywords', label: 'Keywords' }
  ];

  return (
    <div style={{ width: '400px', maxHeight: '600px', overflow: 'hidden' }}>
      {isSplashVisible ? (
        <SplashScreen onNext={handleNext} />
      ) : !currentUserId ? (
        <WalletConnect onConnected={handleWalletConnected} />
      ) : (
        <>
          <Header />
      
      {/* Tab Navigation */}
      <div className="tabs" style={{ 
        display: 'flex', 
        background: 'var(--dark)',
        borderBottom: '3px solid var(--gold)'
      }}>
        {[
          { id: 'collection', icon: '📊', label: 'Collection' },
          { id: 'listings', icon: '💼', label: 'Listings' },
          { id: 'marketplace', icon: '🛒', label: 'Market' }
        ].map(tab => (
          <button 
            key={tab.id}
            className={`tab-btn ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.id)}
            style={{
              flex: 1,
              padding: '14px 8px',
              border: 'none',
              background: currentTab === tab.id ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              color: currentTab === tab.id ? 'var(--gold)' : 'rgba(255, 255, 255, 0.6)',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ 
        padding: '16px', 
        maxHeight: '516px', 
        overflowY: 'auto',
        background: '#FAFAFA'
      }}>
        {statusMessage && (
          <StatusMessage 
            type={statusMessage.type} 
            message={statusMessage.message}
            onClose={() => setStatusMessage(null)}
          />
        )}

        {/* Collection Tab */}
        {currentTab === 'collection' && (
          <div>
            <h3>Collection Settings</h3>
            
            <div className="wallet-status" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: currentUserId 
                ? 'linear-gradient(135deg, #E8F5E9 0%, var(--white) 100%)'
                : 'linear-gradient(135deg, #FFEBEE 0%, var(--white) 100%)',
              borderRadius: 'var(--border-radius)',
              fontSize: '12px',
              marginBottom: '14px',
              border: currentUserId ? '2px solid var(--success)' : '2px solid var(--error)',
              transition: 'all 0.3s ease'
            }}>
              <span style={{ fontSize: '18px' }}>💳</span>
              <span style={{ flex: 1 }}>
                {currentUserId 
                  ? `Connected: ${currentUserId.substring(0, 6)}...${currentUserId.slice(-4)}`
                  : 'Wallet not connected'}
              </span>
              <button 
                className="btn-primary"
                onClick={currentUserId ? handleDisconnectWallet : handleConnectWallet}
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                {currentUserId ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '10px',
                background: 'var(--gold-light)',
                borderRadius: 'var(--border-radius-sm)',
                border: '2px solid var(--gold)'
              }}>
                <input 
                  type="checkbox" 
                  checked={globalPref}
                  onChange={(e) => setGlobalPref(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--gold)' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--purple)' }}>
                  Enable data collection
                </span>
              </label>
            </div>

            <h4>Categories</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '6px', 
              marginBottom: '14px' 
            }}>
              {categories.map(cat => (
                <label key={cat.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 400,
                  textTransform: 'none',
                  letterSpacing: 0,
                  color: 'var(--dark)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: 'var(--border-radius-sm)',
                  transition: 'background 0.2s'
                }}>
                  <input 
                    type="checkbox"
                    checked={!!categoryPrefs[cat.key]}
                    onChange={(e) => setCategoryPrefs({
                      ...categoryPrefs,
                      [cat.key]: e.target.checked
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--gold)' }}
                  />
                  {cat.label}
                </label>
              ))}
            </div>

            <div className="grid-2" style={{ marginBottom: '14px' }}>
              <button className="btn-primary" onClick={handleSavePrefs}>Save Settings</button>
              <button className="btn-danger" onClick={handleClearData}>Clear Data</button>
            </div>

            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              margin: '14px 0', 
              padding: '10px', 
              background: 'var(--white)', 
              borderRadius: 'var(--border-radius-sm)', 
              border: '2px solid var(--neutral)' 
            }}>
              {storageInfo}
            </div>

            <div style={{ 
              maxHeight: '180px', 
              overflow: 'auto', 
              border: '2px solid var(--neutral)',
              background: 'white', 
              padding: '8px', 
              borderRadius: 'var(--border-radius-sm)'
            }}>
              {domainList.length === 0 ? (
                <div>No collected events.</div>
              ) : (
                domainList.map(({ domain, count }) => (
                  <div key={domain} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '8px', 
                    borderBottom: '1px solid var(--neutral)',
                    transition: 'background 0.2s'
                  }}>
                    <div>{domain} — {count} events</div>
                    <button 
                      onClick={() => handleDeleteDomain(domain)}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {currentTab === 'listings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>My Data Listings</h3>
              <button className="btn-primary" onClick={handleOpenCreateListing}>+ Create Listing</button>
            </div>

            <div className="stats">
              <div className="stat-card">
                <div className="stat-value">{stats.active}</div>
                <div className="stat-label">Active</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.sold}</div>
                <div className="stat-label">Sold</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">${stats.earnings.toFixed(2)}</div>
                <div className="stat-label">Earnings</div>
              </div>
            </div>

            {!currentUserId ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔒</div>
                <p>Connect your wallet to view listings</p>
              </div>
            ) : myListings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p>No listings yet. Create your first listing!</p>
              </div>
            ) : (
              myListings.map(listing => (
                <ListingCard 
                  key={listing.id}
                  listing={listing}
                  isOwn={true}
                  onDelete={handleDeleteListing}
                />
              ))
            )}
          </div>
        )}

        {/* Marketplace Tab */}
        {currentTab === 'marketplace' && (
          <div>
            <h3>Browse Data Marketplace</h3>
            
            <div className="filters" style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'browsing', label: 'Browsing' },
                { id: 'social', label: 'Social Media' },
                { id: 'shopping', label: 'Shopping' },
                { id: 'video', label: 'Video' }
              ].map(filter => (
                <button 
                  key={filter.id}
                  className={`filter-chip ${activeFilter === filter.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveFilter(filter.id);
                    loadMarketplaceData();
                  }}
                  style={{
                    padding: '7px 14px',
                    border: '2px solid var(--neutral)',
                    borderRadius: '20px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: activeFilter === filter.id ? 'var(--purple)' : 'white',
                    transition: 'all 0.3s ease',
                    fontWeight: 500,
                    color: activeFilter === filter.id ? 'white' : 'var(--dark)'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="form-group">
              <input 
                type="text" 
                placeholder="Search by description or seller..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setTimeout(() => loadMarketplaceData(), 300);
                }}
              />
            </div>

            {marketplaceListings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <p>No listings found</p>
              </div>
            ) : (
              marketplaceListings.map(listing => (
                <ListingCard 
                  key={listing.id}
                  listing={listing}
                  isOwn={false}
                  onPurchase={handleOpenPurchase}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      <Modal 
        isOpen={createListingModal}
        onClose={() => setCreateListingModal(false)}
        title="Create Data Listing"
      >
        <div className="form-group">
          <label>Listing Title</label>
          <input 
            type="text" 
            placeholder="e.g., Browsing History - Tech Sites"
            value={listingForm.title}
            onChange={(e) => setListingForm({...listingForm, title: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea 
            placeholder="Describe your dataset..."
            value={listingForm.description}
            onChange={(e) => setListingForm({...listingForm, description: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Data Type</label>
          <select 
            value={listingForm.dataType}
            onChange={(e) => setListingForm({...listingForm, dataType: e.target.value})}
          >
            <option value="browsing">Browsing History</option>
            <option value="social">Social Media Activity</option>
            <option value="shopping">Shopping Behavior</option>
            <option value="video">Video Consumption</option>
            <option value="mixed">Mixed Activity</option>
          </select>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Data Size (events)</label>
            <input type="number" value={listingForm.size} readOnly />
          </div>
          <div className="form-group">
            <label>Price (USD)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', color: 'var(--purple)', fontWeight: 600 }}>$</span>
              <input 
                type="number" 
                placeholder="0.00" 
                step="0.01" 
                min="0"
                value={listingForm.price}
                onChange={(e) => setListingForm({...listingForm, price: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Time Range</label>
          <input type="text" value={listingForm.timeRange} readOnly placeholder="Auto-calculated from data" />
        </div>

        <div className="grid-2" style={{ marginTop: '16px' }}>
          <button className="btn-secondary" onClick={() => setCreateListingModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreateListing}>Create Listing</button>
        </div>
      </Modal>

      {/* Purchase Modal */}
      <Modal 
        isOpen={purchaseModal}
        onClose={() => setPurchaseModal(false)}
        title="Purchase Data"
      >
        {currentPurchaseListing && (
          <>
            <div className="card">
              <h4 style={{ marginTop: 0 }}>{currentPurchaseListing.title}</h4>
              <p style={{ fontSize: '12px', color: 'var(--muted)' }}>{currentPurchaseListing.description}</p>
              <div style={{ marginTop: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
                  <span>Data Type:</span>
                  <strong>{currentPurchaseListing.dataType}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
                  <span>Data Size:</span>
                  <strong>{currentPurchaseListing.dataSize} events</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
                  <span>Time Range:</span>
                  <strong>{currentPurchaseListing.timeRange}</strong>
                </div>
                <hr style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '16px' }}>
                  <span>Total Price:</span>
                  <strong style={{ color: 'var(--primary)' }}>${currentPurchaseListing.price?.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="status-msg warning" style={{ margin: '12px 0' }}>
              <strong>⚠️ Important:</strong> This transaction will be processed via blockchain. Make sure your wallet is connected and has sufficient funds.
            </div>

            <div className="grid-2" style={{ marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setPurchaseModal(false)}>Cancel</button>
              <button className="btn-success" onClick={handlePurchase}>Confirm Purchase</button>
            </div>
          </>
        )}
      </Modal>
        </>
      )}
    </div>
  );
};

export default PopupApp;
