import React, { useState, useEffect } from 'react';
import ListingCard from '../components/ListingCard';
import SplashScreen from '../components/SplashScreen';
import WalletConnect from '../components/WalletConnect';

const OptionsApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSplashVisible, setSplashVisible] = useState(true);
  
  // Dashboard stats
  const [dashStats, setDashStats] = useState({
    collectedEvents: 0,
    activeListings: 0,
    soldListings: 0,
    totalEarnings: 0
  });
  
  // Marketplace
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // My Listings
  const [myListings, setMyListings] = useState([]);
  
  // Settings
  const [globalPref, setGlobalPref] = useState(true);
  const [categoryPrefs, setCategoryPrefs] = useState({});
  const [walrusConfig, setWalrusConfig] = useState({
    enabled: false,
    baseUrl: '',
    apiKey: ''
  });
  const [walrusTestStatus, setWalrusTestStatus] = useState('');

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    loadPageData(currentPage);
  }, [currentPage, activeFilter, searchTerm]);

  const init = async () => {
    const walletStatus = await window.MarketplaceAPI.wallet.getStatus();
    if (walletStatus.connected) {
      setCurrentUserId(walletStatus.address);
    }
  };

  const loadPageData = async (page) => {
    switch (page) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'marketplace':
        await loadMarketplace();
        break;
      case 'listings':
        await loadMyListingsData();
        break;
      case 'settings':
        await loadSettings();
        break;
    }
  };

  const loadDashboard = async () => {
    const dataInfo = await window.MarketplaceAPI.dataHelper.getCollectedDataInfo();
    
    let activeListings = 0;
    let soldListings = 0;
    let earnings = 0;
    
    if (currentUserId) {
      const listings = await window.MarketplaceAPI.listing.getMyListings(currentUserId);
      activeListings = listings.filter(l => l.status === 'listed').length;
      soldListings = listings.filter(l => l.status === 'sold').length;
      earnings = await window.MarketplaceAPI.transaction.getEarnings(currentUserId);
    }
    
    setDashStats({
      collectedEvents: dataInfo.size,
      activeListings,
      soldListings,
      totalEarnings: earnings
    });
  };

  const loadMarketplace = async () => {
    let listings = await window.MarketplaceAPI.listing.getMarketplaceListings(currentUserId);
    
    if (activeFilter !== 'all') {
      listings = listings.filter(l => l.dataType === activeFilter);
    }
    
    if (searchTerm) {
      listings = listings.filter(l =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setMarketplaceListings(listings);
  };

  const loadMyListingsData = async () => {
    if (!currentUserId) {
      setMyListings([]);
      return;
    }
    
    const listings = await window.MarketplaceAPI.listing.getMyListings(currentUserId);
    setMyListings(listings.sort((a,b) => b.createdAt - a.createdAt));
  };

  const loadSettings = async () => {
    const s = await chrome.storage.local.get(['collector_prefs', 'walrus_config_v1']);
    let prefs = s.collector_prefs || {
      global: true,
      enabled: {
        urls: true, titles: true, timeOnPage: true, interactions: true,
        referrers: true, sessions: true, categories: true, metadata: true, keywords: true
      }
    };
    
    setGlobalPref(prefs.global);
    setCategoryPrefs(prefs.enabled);
    
    const walrusCfg = s.walrus_config_v1 || { enabled: false, baseUrl: '', apiKey: '' };
    setWalrusConfig(walrusCfg);
  };

  const handleWalletToggle = async () => {
    if (currentUserId) {
      await window.MarketplaceAPI.wallet.disconnect();
      setCurrentUserId(null);
    } else {
      const result = await window.MarketplaceAPI.wallet.connect();
      if (result.success) {
        setCurrentUserId(result.address);
        loadDashboard();
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    }
  };

  const handleCreateListing = async () => {
    const dataInfo = await window.MarketplaceAPI.dataHelper.getCollectedDataInfo();
    
    if (dataInfo.isEmpty) {
      alert('No data collected yet. Enable collection and browse some sites first.');
      setCurrentPage('settings');
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
      loadMyListingsData();
      loadDashboard();
    } else {
      alert(`Failed to create listing: ${result.error}`);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Delete this listing?')) return;
    
    const result = await window.MarketplaceAPI.listing.deleteListing(listingId);
    if (result.success) {
      alert('Listing deleted');
      loadMyListingsData();
      loadDashboard();
    }
  };

  const handlePurchaseListing = async (listing) => {
    if (!currentUserId) {
      alert('Please connect your wallet first');
      return;
    }
    
    const confirmPurchase = window.confirm(
      `Purchase "${listing.title}" for $${listing.price.toFixed(2)}?\n\nThis will process a blockchain transaction.`
    );
    
    if (!confirmPurchase) return;
    
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
  };

  const handleSaveSettings = async () => {
    await chrome.storage.local.set({ 
      collector_prefs: { global: globalPref, enabled: categoryPrefs } 
    });

    if (window.WalrusAPI) {
      await window.WalrusAPI.saveConfig(walrusConfig);
    }
    
    alert('Settings saved successfully!');
  };

  const handleClearAllData = async () => {
    if (!confirm('Clear ALL collected data? This cannot be undone.')) return;
    
    await chrome.storage.local.remove(['activity_events_v1']);
    alert('All data cleared');
    loadDashboard();
  };

  const handleTestWalrus = async () => {
    setWalrusTestStatus('Testing...');
    try {
      if (window.WalrusAPI) {
        await window.WalrusAPI.saveConfig(walrusConfig);
        const res = await window.WalrusAPI.testConnection();
        if (res.success) {
          setWalrusTestStatus('✅ Connection OK');
        } else {
          setWalrusTestStatus('⚠️ ' + (res.error || 'Failed'));
        }
      } else {
        setWalrusTestStatus('Walrus service not loaded');
      }
    } catch (err) {
      setWalrusTestStatus('Error: ' + err.message);
    }
  };

  const handleNext = () => {
    setSplashVisible(false);
  };

  const handleWalletConnected = (address) => {
    setCurrentUserId(address);
    loadDashboard();
  };

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

  return (
    <div>
      {isSplashVisible ? (
        <SplashScreen onNext={handleNext} />
      ) : !currentUserId ? (
        <WalletConnect onConnected={handleWalletConnected} />
      ) : (
        <>
          {/* Header */}
          <header style={{
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-hover) 100%)',
            borderBottom: '3px solid var(--purple)',
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
          }}>
            <div className="logo" style={{
              fontSize: '28px',
              fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: 'var(--purple)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <img 
                src="../../assets/icons/new icons/android-chrome-192x192.png" 
                alt="MineShare logo" 
                width="32" 
                height="32"
              />
              MineShare
            </div>
            
            <nav style={{ display: 'flex', gap: '16px' }}>
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'marketplace', label: 'Browse Marketplace' },
                { id: 'listings', label: 'My Listings' },
                { id: 'settings', label: 'Settings' }
              ].map(page => (
                <a
                  key={page.id}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(page.id);
                  }}
                  className={currentPage === page.id ? 'active' : ''}
                  style={{
                    textDecoration: 'none',
                    color: currentPage === page.id ? 'var(--white)' : 'var(--purple)',
                    fontWeight: 600,
                    padding: '10px 20px',
                    borderRadius: 'var(--border-radius-sm)',
                    transition: 'all 0.3s ease',
                    background: currentPage === page.id ? 'var(--purple)' : 'var(--white)',
                    border: '2px solid transparent',
                    borderColor: currentPage === page.id ? 'var(--purple)' : 'transparent'
                  }}
                >
                  {page.label}
                </a>
              ))}
            </nav>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 18px',
              background: currentUserId ? 'linear-gradient(135deg, var(--white) 0%, rgba(76, 175, 80, 0.05) 100%)' : 'var(--white)',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '14px',
              fontWeight: 600,
              border: currentUserId ? '2px solid var(--success)' : '2px solid var(--purple)',
              color: 'var(--purple)',
              borderLeft: currentUserId ? '4px solid var(--success)' : 'none'
            }}>
              <span>
                {currentUserId 
                  ? `${currentUserId.substring(0, 6)}...${currentUserId.slice(-4)}`
                  : 'Not Connected'}
              </span>
              <button 
                className="btn-primary"
                onClick={handleWalletToggle}
                style={{ padding: '8px 14px', fontSize: '13px' }}
              >
                {currentUserId ? 'Disconnect' : 'Connect Wallet'}
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
            {/* Dashboard Page */}
            {currentPage === 'dashboard' && (
              <div>
                <h1>Dashboard</h1>
                <p className="subtitle" style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '28px' }}>
                  Overview of your data collection and marketplace activity
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  marginBottom: '40px'
                }}>
                  {[
                    { label: 'Events Collected', value: dashStats.collectedEvents },
                    { label: 'Active Listings', value: dashStats.activeListings },
                    { label: 'Sold Listings', value: dashStats.soldListings },
                    { label: 'Total Earnings', value: `$${dashStats.totalEarnings.toFixed(2)}` }
                  ].map((stat, i) => (
                    <div key={i} style={{
                      background: 'linear-gradient(135deg, var(--white) 0%, var(--gold-light) 100%)',
                      borderRadius: 'var(--border-radius)',
                      padding: '28px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      border: '2px solid var(--gold)',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        fontSize: '42px',
                        fontWeight: 700,
                        fontFamily: "'Poppins', sans-serif",
                        color: 'var(--purple)',
                        marginBottom: '8px'
                      }}>
                        {stat.value}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 600
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
                
                <h2>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button className="primary" onClick={handleCreateListing}>
                    📝 Create New Listing
                  </button>
                  <button className="secondary" onClick={() => setCurrentPage('marketplace')}>
                    🛒 Browse Marketplace
                  </button>
                  <button className="secondary" onClick={() => setCurrentPage('settings')}>
                    ⚙️ Collection Settings
                  </button>
                </div>
              </div>
            )}

            {/* Marketplace Page */}
            {currentPage === 'marketplace' && (
              <div>
                <h1>Browse Marketplace</h1>
                <p className="subtitle" style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '28px' }}>
                  Discover and purchase data from other users
                </p>
                
                <input 
                  type="text" 
                  className="search-box"
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '600px',
                    padding: '14px 22px',
                    border: '2px solid var(--neutral)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '15px',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '28px',
                    transition: 'all 0.3s ease'
                  }}
                />
                
                <div style={{ display: 'flex', gap: '14px', marginBottom: '28px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'browsing', label: 'Browsing History' },
                    { id: 'social', label: 'Social Media' },
                    { id: 'shopping', label: 'Shopping' },
                    { id: 'video', label: 'Video Consumption' }
                  ].map(filter => (
                    <div
                      key={filter.id}
                      className={`filter-chip ${activeFilter === filter.id ? 'active' : ''}`}
                      onClick={() => setActiveFilter(filter.id)}
                      style={{
                        padding: '10px 20px',
                        border: '2px solid var(--neutral)',
                        borderRadius: '24px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: activeFilter === filter.id ? 'var(--purple)' : 'var(--white)',
                        transition: 'all 0.3s ease',
                        color: activeFilter === filter.id ? 'white' : 'var(--dark)'
                      }}
                    >
                      {filter.label}
                    </div>
                  ))}
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '24px',
                  marginTop: '28px'
                }}>
                  {marketplaceListings.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🔍</div>
                      <h2>No listings found</h2>
                    </div>
                  ) : (
                    marketplaceListings.map(listing => (
                      <div key={listing.id} style={{
                        background: 'var(--white)',
                        borderRadius: 'var(--border-radius)',
                        padding: '24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        border: '2px solid var(--neutral)'
                      }}>
                        <ListingCard 
                          listing={listing}
                          isOwn={false}
                          onPurchase={handlePurchaseListing}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* My Listings Page */}
            {currentPage === 'listings' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <div>
                    <h1>My Listings</h1>
                    <p className="subtitle" style={{ color: 'var(--muted)', fontSize: '16px' }}>
                      Manage your data listings
                    </p>
                  </div>
                  <button className="primary" onClick={handleCreateListing}>+ Create New Listing</button>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '24px',
                  marginTop: '28px'
                }}>
                  {!currentUserId ? (
                    <div className="empty-state">
                      <div className="empty-icon">🔒</div>
                      <h2>Connect wallet to view listings</h2>
                    </div>
                  ) : myListings.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📦</div>
                      <h2>No listings yet</h2>
                      <p>Create your first listing to start earning!</p>
                    </div>
                  ) : (
                    myListings.map(listing => (
                      <div key={listing.id} style={{
                        background: 'var(--white)',
                        borderRadius: 'var(--border-radius)',
                        padding: '24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        border: '2px solid var(--neutral)'
                      }}>
                        <ListingCard 
                          listing={listing}
                          isOwn={true}
                          onDelete={handleDeleteListing}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Settings Page */}
            {currentPage === 'settings' && (
              <div>
                <h1>Collection Settings</h1>
                <p className="subtitle" style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '28px' }}>
                  Control what data is collected
                </p>
                
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginTop: '24px', maxWidth: '800px' }}>
                  <h2>Data Collection</h2>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', margin: '20px 0' }}>
                    <input 
                      type="checkbox" 
                      checked={globalPref}
                      onChange={(e) => setGlobalPref(e.target.checked)}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span>Enable data collection</span>
                  </label>
                  
                  <h3 style={{ margin: '24px 0 16px' }}>Collection Categories</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {categories.map(cat => (
                      <label key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                        <input 
                          type="checkbox"
                          checked={!!categoryPrefs[cat.key]}
                          onChange={(e) => setCategoryPrefs({
                            ...categoryPrefs,
                            [cat.key]: e.target.checked
                          })}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span>{cat.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  <button className="primary" onClick={handleSaveSettings} style={{ marginTop: '24px' }}>
                    Save Settings
                  </button>
                  <button className="danger" onClick={handleClearAllData} style={{ marginTop: '24px', marginLeft: '12px' }}>
                    Clear All Data
                  </button>
                </div>

                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginTop: '24px', maxWidth: '800px' }}>
                  <h2 style={{ marginTop: '40px' }}>Walrus Blockchain</h2>
                  <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '12px' }}>
                    Configure optional Walrus integration for data commitment and purchase receipts.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 600 }}>
                    <input 
                      type="checkbox"
                      checked={walrusConfig.enabled}
                      onChange={(e) => setWalrusConfig({...walrusConfig, enabled: e.target.checked})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    Enable Walrus Integration
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Endpoint Base URL</label>
                      <input 
                        type="text" 
                        placeholder="https://your-walrus-endpoint"
                        value={walrusConfig.baseUrl}
                        onChange={(e) => setWalrusConfig({...walrusConfig, baseUrl: e.target.value})}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>API Key (optional)</label>
                      <input 
                        type="text" 
                        placeholder="Bearer token"
                        value={walrusConfig.apiKey}
                        onChange={(e) => setWalrusConfig({...walrusConfig, apiKey: e.target.value})}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="secondary" onClick={handleTestWalrus}>Test Connection</button>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{walrusTestStatus}</span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default OptionsApp;
