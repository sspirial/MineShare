import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import './CreateListing.css';
import { getOwnedDatasets, createListing, mintDataset } from '../api/sui_api';
import { uploadToWalrus, blobIdToBytes } from '../api/walrus_api';

function CreateListing({ currentAccount, onListingCreated }) {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [pendingExportData, setPendingExportData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dataType: 'browsing',
    price: '0.1'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    if (currentAccount?.address) {
      loadDatasets();
      checkForPendingExport();
    }
  }, [currentAccount]);

  const checkForPendingExport = async () => {
    // Check URL for export flag
    const params = new URLSearchParams(window.location.search);
    if (params.get('export') === 'pending') {
      // Try to get data from extension
      try {
        // Access chrome.storage from the extension
        if (window.chrome && chrome.storage) {
          const data = await chrome.storage.local.get(['pending_export', 'export_timestamp']);
          if (data.pending_export && data.export_timestamp) {
            // Check if export is recent (within last 5 minutes)
            const age = Date.now() - data.export_timestamp;
            if (age < 5 * 60 * 1000) {
              setPendingExportData(data.pending_export);
              setMessage('✅ Data imported from extension! Click "Mint & List Dataset" below.');
              
              // Pre-fill some form data
              const exportData = data.pending_export;
              setFormData({
                ...formData,
                title: `Browsing Data - ${new Date(exportData.exportedAt).toLocaleDateString()}`,
                description: `${exportData.summary?.totalDomains || 0} domains, ${exportData.summary?.totalEvents || 0} events`
              });
            }
          }
        }
      } catch (error) {
        console.log('Could not access extension storage:', error);
      }
    }
  };

  const loadDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const ownedDatasets = await getOwnedDatasets(currentAccount.address);
      setDatasets(ownedDatasets);
      
      if (ownedDatasets.length === 0) {
        setMessage('ℹ️ No datasets found. Use the MineShare extension to create one.');
      }
    } catch (error) {
      setMessage('❌ Failed to load datasets: ' + error.message);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const handleMintAndList = async (e) => {
    e.preventDefault();
    
    if (!pendingExportData) {
      setMessage('❌ No export data available. Use the extension to export data first.');
      return;
    }

    setIsMinting(true);
    setMessage('');

    try {
      // Step 1: Upload to Walrus
      setMessage('📤 Uploading data to Walrus...');
      const { blobId, encryptionKey, size } = await uploadToWalrus(pendingExportData);

      // Step 2: Mint Dataset NFT
      setMessage('⚡ Minting dataset NFT...');
      const cidBytes = blobIdToBytes(blobId);
      const metadata = {
        title: formData.title,
        description: formData.description,
        dataType: formData.dataType,
        domains: pendingExportData.summary?.totalDomains || 0,
        events: pendingExportData.summary?.totalEvents || 0,
        size: size,
        exportedAt: pendingExportData.exportedAt
      };

      const mintResult = await mintDataset(
        cidBytes,
        metadata,
        { signAndExecuteTransactionBlock: signAndExecuteTransaction }
      );

      if (!mintResult.datasetId) {
        throw new Error('Failed to get dataset ID from mint transaction');
      }

      // Step 3: Create Listing
      setMessage('📝 Creating marketplace listing...');
      const listingResult = await createListing(
        mintResult.datasetId,
        parseFloat(formData.price),
        { signAndExecuteTransactionBlock: signAndExecuteTransaction }
      );

      // Store encryption key for buyer access
      if (window.chrome && chrome.storage) {
        await chrome.storage.local.set({
          [`encryption_key_${mintResult.datasetId}`]: encryptionKey
        });
      }

      // Clear pending export
      if (window.chrome && chrome.storage) {
        await chrome.storage.local.remove(['pending_export', 'export_timestamp']);
      }
      
      setPendingExportData(null);

      onListingCreated({
        id: listingResult.listingId,
        datasetId: mintResult.datasetId,
        title: formData.title,
        description: formData.description,
        dataType: formData.dataType,
        price: parseFloat(formData.price)
      });

      setMessage('✅ Success! Dataset minted and listed on marketplace!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        dataType: 'browsing',
        price: '0.1'
      });

      // Reload datasets
      await loadDatasets();
      
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      
    } catch (error) {
      console.error('Mint and list error:', error);
      setMessage('❌ Failed: ' + error.message);
    } finally {
      setIsMinting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage('');

    try {
      if (!selectedDataset) {
        setMessage('❌ Please select a dataset to list');
        setIsCreating(false);
        return;
      }

      setMessage('📝 Creating listing on blockchain...');

      // Create listing on blockchain
      const result = await createListing(
        selectedDataset,
        parseFloat(formData.price),
        {
          signAndExecuteTransactionBlock: signAndExecuteTransaction
        }
      );

      onListingCreated({
        id: result.listingId,
        datasetId: selectedDataset,
        title: formData.title,
        description: formData.description,
        dataType: formData.dataType,
        price: parseFloat(formData.price)
      });

      setMessage('✅ Listing created successfully! Transaction: ' + result.digest.slice(0, 10) + '...');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        dataType: 'browsing',
        price: '0.1'
      });
      setSelectedDataset('');

      // Reload datasets
      await loadDatasets();
    } catch (error) {
      setMessage('❌ Failed to create listing: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const checkExtensionData = async () => {
    // Check if user has minted datasets
    return {
      hasData: datasets.length > 0
    };
  };

  if (isLoadingDatasets) {
    return (
      <div className="create-listing">
        <div className="create-card">
          <h2>Create New Listing</h2>
          <p>Loading your datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-listing">
      <div className="create-card">
        <h2>Create New Listing</h2>
        <p className="create-subtitle">List your dataset on the marketplace</p>

        {/* Show import from extension flow */}
        {pendingExportData && (
          <div style={{ 
            padding: '16px', 
            background: '#e8f5e9', 
            border: '2px solid #4caf50',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>
              📦 Data Ready to Mint
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
              <strong>Domains:</strong> {pendingExportData.summary?.totalDomains || 0} • 
              <strong> Events:</strong> {pendingExportData.summary?.totalEvents || 0}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              Fill in the details below and click "Mint & List Dataset"
            </p>
          </div>
        )}

        <form onSubmit={pendingExportData ? handleMintAndList : handleSubmit}>
          {!pendingExportData && (
            <div className="form-group">
              <label htmlFor="dataset">Select Existing Dataset *</label>
              <select
                id="dataset"
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                required={!pendingExportData}
              >
                <option value="">-- Choose a dataset --</option>
                {datasets.map(ds => (
                  <option key={ds.id} value={ds.id}>
                    Dataset {ds.id.slice(0, 8)}... 
                    {ds.content?.fields?.meta && ` - ${JSON.parse(new TextDecoder().decode(new Uint8Array(ds.content.fields.meta))).title}`}
                  </option>
                ))}
              </select>
              {datasets.length === 0 && !pendingExportData && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  No datasets available. Use the extension to export data first.
                </p>
              )}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Tech News Browsing Data - October 2025"
              required
              minLength={10}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe your dataset: what sites you visited, topics covered, time period, etc."
              required
              minLength={20}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dataType">Data Type *</label>
            <select
              id="dataType"
              value={formData.dataType}
              onChange={(e) => setFormData({...formData, dataType: e.target.value})}
            >
              <option value="browsing">Browsing History</option>
              <option value="shopping">Shopping Behavior</option>
              <option value="social">Social Media Activity</option>
              <option value="research">Research & Learning</option>
              <option value="entertainment">Entertainment Preferences</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (SUI) *</label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="0.1"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          {message && (
            <div className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" className="create-btn" disabled={isCreating || isMinting}>
            {isMinting ? '🚀 Minting & Listing...' : 
             isCreating ? 'Creating Listing...' : 
             pendingExportData ? '🚀 Mint & List Dataset' : 
             'Create Listing'}
          </button>
        </form>

        {!pendingExportData && (
          <div className="extension-info">
            <p>💡 <strong>Tip:</strong> Use the MineShare browser extension to collect and export data for listing.</p>
          </div>
        )}

        <div className="extension-info">
          <p>💡 <strong>Tip:</strong> Make sure you have collected data using the MineShare browser extension before creating a listing.</p>
        </div>
      </div>
    </div>
  );
}

export default CreateListing;
