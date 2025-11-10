import React, { useState, useEffect } from 'react';

const OptionsApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [globalPref, setGlobalPref] = useState(true);
  const [categoryPrefs, setCategoryPrefs] = useState({});
  const [dashStats, setDashStats] = useState({ collectedEvents: 0 });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    loadPageData(currentPage);
  }, [currentPage]);

  const init = async () => {
    await loadSettings();
    await loadDashboard();
  };

  const loadPageData = async (page) => {
    if (page === 'dashboard') {
      await loadDashboard();
    } else if (page === 'settings') {
      await loadSettings();
    }
  };

  const loadDashboard = async () => {
    const s = await chrome.storage.local.get(['activity_events_v1']);
    const arr = s.activity_events_v1 || [];
    setDashStats({ collectedEvents: arr.length });
  };

  const loadSettings = async () => {
    const s = await chrome.storage.local.get(['collector_prefs']);
    let prefs = s.collector_prefs || {
      global: true,
      enabled: { urls: true, titles: true, timeOnPage: true, interactions: true,
        referrers: true, sessions: true, categories: true, metadata: true, keywords: true }
    };
    setGlobalPref(prefs.global);
    setCategoryPrefs(prefs.enabled);
  };

  const handleSaveSettings = async () => {
    await chrome.storage.local.set({ 
      collector_prefs: { global: globalPref, enabled: categoryPrefs } 
    });
    alert('Settings saved successfully!');
  };

  const handleClearAllData = async () => {
    if (!confirm('Clear ALL collected data? This cannot be undone.')) return;
    await chrome.storage.local.remove(['activity_events_v1']);
    alert('All data cleared');
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
      <header style={{
        background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-hover) 100%)',
        borderBottom: '3px solid var(--purple)', padding: '20px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
      }}>
        <div className="logo" style={{
          fontSize: '28px', fontWeight: 700, fontFamily: "'Poppins', sans-serif",
          color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <img src="../../assets/icons/new icons/android-chrome-192x192.png" 
            alt="MineShare logo" width="32" height="32" />
          MineShare
        </div>
        
        <nav style={{ display: 'flex', gap: '16px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'settings', label: 'Settings' }
          ].map(page => (
            <a key={page.id} href="#"
              onClick={(e) => { e.preventDefault(); setCurrentPage(page.id); }}
              className={currentPage === page.id ? 'active' : ''}
              style={{
                textDecoration: 'none',
                color: currentPage === page.id ? 'var(--white)' : 'var(--purple)',
                fontWeight: 600, padding: '10px 20px',
                borderRadius: 'var(--border-radius-sm)', transition: 'all 0.3s ease',
                background: currentPage === page.id ? 'var(--purple)' : 'var(--white)',
                border: '2px solid transparent',
                borderColor: currentPage === page.id ? 'var(--purple)' : 'transparent'
              }}>
              {page.label}
            </a>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {currentPage === 'dashboard' && (
          <div>
            <h1>Dashboard</h1>
            <p className="subtitle" style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '28px' }}>
              Overview of your data collection activity
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px', marginBottom: '40px' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--white) 0%, var(--gold-light) 100%)',
                borderRadius: 'var(--border-radius)', padding: '28px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid var(--gold)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  fontSize: '42px', fontWeight: 700, fontFamily: "'Poppins', sans-serif",
                  color: 'var(--purple)', marginBottom: '8px'
                }}>
                  {dashStats.collectedEvents}
                </div>
                <div style={{
                  fontSize: '14px', color: 'var(--muted)', textTransform: 'uppercase',
                  letterSpacing: '1px', fontWeight: 600
                }}>
                  Events Collected
                </div>
              </div>
            </div>
            
            <h2>Quick Actions</h2>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="secondary" onClick={() => setCurrentPage('settings')}>
                ⚙️ Collection Settings
              </button>
            </div>
          </div>
        )}

        {currentPage === 'settings' && (
          <div>
            <h1>Collection Settings</h1>
            <p className="subtitle" style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '28px' }}>
              Control what data is collected
            </p>
            
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', 
              marginTop: '24px', maxWidth: '800px' }}>
              <h2>Data Collection</h2>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', 
                fontSize: '16px', margin: '20px 0' }}>
                <input type="checkbox" checked={globalPref}
                  onChange={(e) => setGlobalPref(e.target.checked)}
                  style={{ width: '20px', height: '20px' }} />
                <span>Enable data collection</span>
              </label>
              
              <h3 style={{ margin: '24px 0 16px' }}>Collection Categories</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {categories.map(cat => (
                  <label key={cat.key} style={{ display: 'flex', alignItems: 'center', 
                    gap: '8px', fontSize: '15px' }}>
                    <input type="checkbox" checked={!!categoryPrefs[cat.key]}
                      onChange={(e) => setCategoryPrefs({...categoryPrefs, [cat.key]: e.target.checked})}
                      style={{ width: '18px', height: '18px' }} />
                    <span>{cat.label}</span>
                  </label>
                ))}
              </div>
              
              <button className="primary" onClick={handleSaveSettings} 
                style={{ marginTop: '24px' }}>
                Save Settings
              </button>
              <button className="danger" onClick={handleClearAllData} 
                style={{ marginTop: '24px', marginLeft: '12px' }}>
                Clear All Data
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OptionsApp;
