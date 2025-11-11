import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatusMessage from '../components/StatusMessage';
import { getAggregatedData } from '../api/data_api';
import CONFIG from '../config';

const PopupApp = () => {
  const [statusMessage, setStatusMessage] = useState(null);
  const [globalPref, setGlobalPref] = useState(true);
  const [categoryPrefs, setCategoryPrefs] = useState({});
  const [storageInfo, setStorageInfo] = useState('');
  const [domainList, setDomainList] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await loadPrefs();
    await refreshStorageInfo();
    await refreshDomainList();
  };

  const handleExportToMarketplace = async () => {
    setIsExporting(true);
    try {
      // Get collected data
      const stored = await chrome.storage.local.get(['activity_events_v1']);
      const events = stored.activity_events_v1 || [];

      if (events.length === 0) {
        showStatus('error', 'No data collected yet. Browse some websites first!');
        setIsExporting(false);
        return;
      }

      showStatus('info', 'Preparing data for export...');

      // Aggregate data
      const aggregatedData = getAggregatedData(events, { topKeywords: 10 });

      // Prepare dataset for export
      const datasetToExport = {
        ...aggregatedData,
        exportedAt: new Date().toISOString(),
        totalEvents: events.length,
        version: '1.0'
      };

      // Store the export data in a special key that the dApp can access
      // Use both chrome.storage (for extension) and prepare for cross-context transfer
      await chrome.storage.local.set({ 
        pending_export: datasetToExport,
        export_timestamp: Date.now()
      });

      showStatus('success', 'Data prepared! Opening marketplace...');

      // Open dApp with a flag to indicate there's data to export
      // We'll inject the data into the page via content script
      setTimeout(() => {
        chrome.tabs.create({ 
          url: `${CONFIG.DAPP_URL}?export=pending`,
          active: true 
        }, (tab) => {
          // Store the export data with tab ID for the content script to inject
          chrome.storage.local.set({
            [`pending_export_tab_${tab.id}`]: datasetToExport
          });
        });
      }, 1000);

    } catch (error) {
      console.error('Export preparation error:', error);
      showStatus('error', 'Failed to prepare export: ' + error.message);
    } finally {
      setIsExporting(false);
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

  const showStatus = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 3000);
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
      <Header />
      
      <div style={{ 
        padding: 'var(--spacing-md)', 
        maxHeight: '516px', 
        overflowY: 'auto', 
        background: 'var(--color-background-light)' 
      }}>
        {statusMessage && (
          <StatusMessage 
            type={statusMessage.type} 
            message={statusMessage.message}
            onClose={() => setStatusMessage(null)}
          />
        )}

        <div>
          <h3>Data Collection Settings</h3>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-sm)', 
              cursor: 'pointer',
              padding: 'var(--spacing-sm)', 
              background: 'rgba(255, 184, 0, 0.08)',
              borderRadius: 'var(--radius-sm)', 
              border: '2px solid var(--color-brand-secondary)'
            }}>
              <input 
                type="checkbox" 
                checked={globalPref}
                onChange={(e) => setGlobalPref(e.target.checked)}
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  accentColor: 'var(--color-brand-secondary)',
                  cursor: 'pointer'
                }}
              />
              <span style={{ 
                fontSize: 'var(--font-size-sm)', 
                fontWeight: 'var(--font-weight-semibold)', 
                color: 'var(--color-brand-primary)' 
              }}>
                Enable data collection
              </span>
            </label>
          </div>

          <h4>Categories</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 'var(--spacing-2xs)', 
            marginBottom: 'var(--spacing-md)' 
          }}>
            {categories.map(cat => (
              <label key={cat.key} style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-xs)', 
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-regular)', 
                textTransform: 'none', 
                letterSpacing: 0,
                color: 'var(--color-text-default)', 
                cursor: 'pointer', 
                padding: 'var(--spacing-2xs)',
                borderRadius: 'var(--radius-sm)', 
                transition: 'background var(--transition-fast)'
              }}>
                <input 
                  type="checkbox" 
                  checked={!!categoryPrefs[cat.key]}
                  onChange={(e) => setCategoryPrefs({...categoryPrefs, [cat.key]: e.target.checked})}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    cursor: 'pointer', 
                    accentColor: 'var(--color-brand-secondary)' 
                  }}
                />
                {cat.label}
              </label>
            ))}
          </div>

          <div className="grid-2" style={{ marginBottom: 'var(--spacing-md)', gap: 'var(--spacing-xs)' }}>
            <button className="btn-primary" onClick={handleSavePrefs}>Save Settings</button>
            <button className="btn-danger" onClick={handleClearData}>Clear Data</button>
          </div>

          {/* Export to Marketplace */}
          <div style={{ 
            marginTop: 'var(--spacing-lg)', 
            padding: 'var(--spacing-sm)', 
            background: 'rgba(255, 184, 0, 0.08)', 
            borderRadius: 'var(--radius-sm)', 
            border: '2px solid var(--color-brand-secondary)' 
          }}>
            <h4 style={{ marginTop: 0 }}>🌐 Export to Marketplace</h4>
            
            <p style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-sm)' }}>
              Export your collected data to list on the marketplace
            </p>
            <button 
              className="btn-primary" 
              onClick={handleExportToMarketplace}
              disabled={isExporting}
              style={{ width: '100%' }}
            >
              {isExporting ? 'Preparing...' : '📤 Export to Marketplace'}
            </button>
            <p style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: 'var(--color-text-muted)', 
              marginTop: 'var(--spacing-xs)' 
            }}>
              Opens the marketplace where you can upload and list your data
            </p>
          </div>

          <div style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--color-text-muted)', 
            margin: 'var(--spacing-md) 0', 
            padding: 'var(--spacing-sm)',
            background: 'var(--color-background-default)', 
            borderRadius: 'var(--radius-sm)', 
            border: '2px solid var(--color-border-default)' 
          }}>
            {storageInfo}
          </div>

          <div style={{ 
            maxHeight: '180px', 
            overflow: 'auto', 
            border: '2px solid var(--color-border-default)',
            background: 'var(--color-background-default)', 
            padding: 'var(--spacing-xs)', 
            borderRadius: 'var(--radius-sm)' 
          }}>
            {domainList.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--spacing-md)', 
                color: 'var(--color-text-muted)' 
              }}>No collected events.</div>
            ) : (
              domainList.map(({ domain, count }) => (
                <div key={domain} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center', 
                  padding: 'var(--spacing-xs)', 
                  borderBottom: '1px solid var(--color-border-default)',
                  transition: 'background var(--transition-fast)'
                }}>
                  <div style={{ fontSize: 'var(--font-size-xs)' }}>{domain} — {count} events</div>
                  <button 
                    onClick={() => handleDeleteDomain(domain)}
                    className="btn-danger"
                    style={{ 
                      fontSize: 'var(--font-size-xs)', 
                      padding: 'var(--spacing-3xs) var(--spacing-xs)' 
                    }}>
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupApp;
