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
        background: 'linear-gradient(135deg, var(--color-brand-secondary) 0%, var(--color-secondary-hover) 100%)',
        borderBottom: '3px solid var(--color-brand-primary)', 
        padding: 'var(--spacing-lg) var(--spacing-xl)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        boxShadow: 'var(--shadow-gold-sm)'
      }}>
        <div className="logo" style={{
          fontSize: 'var(--font-size-3xl)', 
          fontWeight: 'var(--font-weight-bold)', 
          fontFamily: 'var(--font-family-header)',
          color: 'var(--color-brand-primary)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-sm)',
          letterSpacing: '1px'
        }}>
          <img src="../../assets/icons/new icons/android-chrome-192x192.png" 
            alt="MineShare logo" width="32" height="32" />
          MineShare
        </div>
        
        <nav style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'settings', label: 'Settings' }
          ].map(page => (
            <a key={page.id} href="#"
              onClick={(e) => { e.preventDefault(); setCurrentPage(page.id); }}
              className={currentPage === page.id ? 'active' : ''}
              style={{
                textDecoration: 'none',
                color: currentPage === page.id ? 'var(--color-text-inverse)' : 'var(--color-brand-primary)',
                fontWeight: 'var(--font-weight-semibold)', 
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                borderRadius: 'var(--radius-sm)', 
                transition: 'all var(--transition-base)',
                background: currentPage === page.id ? 'var(--color-brand-primary)' : 'var(--color-background-default)',
                border: '2px solid transparent',
                borderColor: currentPage === page.id ? 'var(--color-brand-primary)' : 'transparent'
              }}>
              {page.label}
            </a>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: 'var(--spacing-xl)' }}>
        {currentPage === 'dashboard' && (
          <div>
            <h1>Dashboard</h1>
            <p className="subtitle" style={{ 
              color: 'var(--color-text-muted)', 
              fontSize: 'var(--font-size-base)', 
              marginBottom: 'var(--spacing-lg)' 
            }}>
              Overview of your data collection activity
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--spacing-lg)', 
              marginBottom: 'var(--spacing-xl)' 
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--color-background-default) 0%, rgba(255, 184, 0, 0.08) 100%)',
                borderRadius: 'var(--radius-md)', 
                padding: 'var(--spacing-xl)',
                boxShadow: 'var(--shadow-md)', 
                border: '2px solid var(--color-brand-secondary)',
                transition: 'all var(--transition-base)'
              }}>
                <div style={{
                  fontSize: 'var(--font-size-5xl)', 
                  fontWeight: 'var(--font-weight-bold)', 
                  fontFamily: 'var(--font-family-header)',
                  color: 'var(--color-brand-primary)', 
                  marginBottom: 'var(--spacing-xs)',
                  letterSpacing: '1px'
                }}>
                  {dashStats.collectedEvents}
                </div>
                <div style={{
                  fontSize: 'var(--font-size-xs)', 
                  color: 'var(--color-text-muted)', 
                  textTransform: 'uppercase',
                  letterSpacing: '1px', 
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  Events Collected
                </div>
              </div>
            </div>
            
            <h2>Quick Actions</h2>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
              <button className="secondary" onClick={() => setCurrentPage('settings')}>
                ⚙️ Collection Settings
              </button>
            </div>
          </div>
        )}

        {currentPage === 'settings' && (
          <div>
            <h1>Collection Settings</h1>
            <p className="subtitle" style={{ 
              color: 'var(--color-text-muted)', 
              fontSize: 'var(--font-size-base)', 
              marginBottom: 'var(--spacing-lg)' 
            }}>
              Control what data is collected
            </p>
            
            <div style={{ 
              background: 'var(--color-background-default)', 
              borderRadius: 'var(--radius-md)', 
              padding: 'var(--spacing-lg)', 
              marginTop: 'var(--spacing-lg)', 
              maxWidth: '800px',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid var(--color-border-default)'
            }}>
              <h2>Data Collection</h2>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-sm)', 
                fontSize: 'var(--font-size-base)', 
                margin: 'var(--spacing-lg) 0',
                cursor: 'pointer'
              }}>
                <input type="checkbox" checked={globalPref}
                  onChange={(e) => setGlobalPref(e.target.checked)}
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    accentColor: 'var(--color-brand-secondary)', 
                    cursor: 'pointer' 
                  }} />
                <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Enable data collection</span>
              </label>
              
              <h3 style={{ 
                marginTop: 'var(--spacing-lg)', 
                marginBottom: 'var(--spacing-md)',
                fontFamily: 'var(--font-family-header)',
                color: 'var(--color-brand-primary)'
              }}>Collection Categories</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 'var(--spacing-sm)' 
              }}>
                {categories.map(cat => (
                  <label key={cat.key} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-xs)', 
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer',
                    padding: 'var(--spacing-xs)',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background var(--transition-fast)'
                  }}>
                    <input type="checkbox" checked={!!categoryPrefs[cat.key]}
                      onChange={(e) => setCategoryPrefs({...categoryPrefs, [cat.key]: e.target.checked})}
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        cursor: 'pointer', 
                        accentColor: 'var(--color-brand-secondary)' 
                      }} />
                    <span>{cat.label}</span>
                  </label>
                ))}
              </div>
              
              <button className="primary" onClick={handleSaveSettings} 
                style={{ marginTop: 'var(--spacing-lg)' }}>
                Save Settings
              </button>
              <button className="danger" onClick={handleClearAllData} 
                style={{ marginTop: 'var(--spacing-lg)', marginLeft: 'var(--spacing-sm)' }}>
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
