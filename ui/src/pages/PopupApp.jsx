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
      await chrome.storage.local.set({ 
        pending_export: datasetToExport,
        export_timestamp: Date.now()
      });

      showStatus('success', 'Data prepared! Opening marketplace...');

      // Open dApp with a flag to indicate there's data to export
      setTimeout(() => {
        chrome.tabs.create({ url: `${CONFIG.DAPP_URL}?export=pending` });
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
      
      <div style={{ padding: '16px', maxHeight: '516px', overflowY: 'auto', background: '#FAFAFA' }}>
        {statusMessage && (
          <StatusMessage 
            type={statusMessage.type} 
            message={statusMessage.message}
            onClose={() => setStatusMessage(null)}
          />
        )}

        <div>
          <h3>Data Collection Settings</h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              padding: '10px', background: 'var(--gold-light)',
              borderRadius: 'var(--border-radius-sm)', border: '2px solid var(--gold)'
            }}>
              <input 
                type="checkbox" checked={globalPref}
                onChange={(e) => setGlobalPref(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--gold)' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--purple)' }}>
                Enable data collection
              </span>
            </label>
          </div>

          <h4>Categories</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
            {categories.map(cat => (
              <label key={cat.key} style={{
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                fontWeight: 400, textTransform: 'none', letterSpacing: 0,
                color: 'var(--dark)', cursor: 'pointer', padding: '6px',
                borderRadius: 'var(--border-radius-sm)', transition: 'background 0.2s'
              }}>
                <input 
                  type="checkbox" checked={!!categoryPrefs[cat.key]}
                  onChange={(e) => setCategoryPrefs({...categoryPrefs, [cat.key]: e.target.checked})}
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

          {/* Export to Marketplace */}
          <div style={{ marginTop: '20px', padding: '12px', background: 'var(--gold-light)', 
            borderRadius: 'var(--border-radius-sm)', border: '2px solid var(--gold)' }}>
            <h4 style={{ marginTop: 0 }}>🌐 Export to Marketplace</h4>
            
            <p style={{ fontSize: '13px', marginBottom: '10px' }}>
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
            <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
              Opens the marketplace where you can upload and list your data
            </p>
          </div>

          <div style={{ fontSize: '12px', color: '#666', margin: '14px 0', padding: '10px',
            background: 'var(--white)', borderRadius: 'var(--border-radius-sm)', 
            border: '2px solid var(--neutral)' }}>
            {storageInfo}
          </div>

          <div style={{ maxHeight: '180px', overflow: 'auto', border: '2px solid var(--neutral)',
            background: 'white', padding: '8px', borderRadius: 'var(--border-radius-sm)' }}>
            {domainList.length === 0 ? (
              <div>No collected events.</div>
            ) : (
              domainList.map(({ domain, count }) => (
                <div key={domain} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '8px', borderBottom: '1px solid var(--neutral)',
                  transition: 'background 0.2s' }}>
                  <div>{domain} — {count} events</div>
                  <button onClick={() => handleDeleteDomain(domain)}
                    style={{ fontSize: '11px', padding: '4px 8px' }}>
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
