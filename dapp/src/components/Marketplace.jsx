import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import './Marketplace.css';
import ListingCard from './ListingCard';
import CreateListing from './CreateListing';
import { getAllListings } from '../api/sui_api';

function Marketplace() {
  const currentAccount = useCurrentAccount();
  const [activeTab, setActiveTab] = useState('browse'); // browse, myListings, create
  const [listings, setListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    loadListings();
    // Refresh listings every 30 seconds instead of 10
    const interval = setInterval(loadListings, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadListings = async () => {
    try {
      console.log('Loading listings from blockchain...');
      const blockchainListings = await getAllListings();
      console.log('Fetched listings:', blockchainListings);
      setListings(blockchainListings);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setIsLoadingListings(false);
    }
  };

  const myListings = currentAccount 
    ? listings.filter(l => l.seller === currentAccount.address)
    : [];

  const browseListings = currentAccount
    ? listings.filter(l => l.seller !== currentAccount.address && !l.sold)
    : listings.filter(l => !l.sold);
  
  // Filter listings based on search query
  const filterListings = (listingsToFilter) => {
    if (!searchQuery.trim()) return listingsToFilter;
    
    const query = searchQuery.toLowerCase();
    return listingsToFilter.filter(listing => {
      // Safely convert values to strings and lowercase
      const datasetId = (listing.dataset ? String(listing.dataset).toLowerCase() : '');
      const sellerId = (listing.seller ? String(listing.seller).toLowerCase() : '');
      const price = (listing.price != null ? String(listing.price) : '');
      
      return datasetId.includes(query) || 
             sellerId.includes(query) || 
             price.includes(query);
    });
  };

  const filteredBrowseListings = filterListings(browseListings);
  const filteredMyListings = filterListings(myListings);
  
  console.log('Current account:', currentAccount?.address);
  console.log('All listings:', listings);
  console.log('My listings:', myListings);
  console.log('Browse listings:', browseListings);

  const handleListingCreated = async (newListing) => {
    // Reload listings from blockchain
    await loadListings();
    setActiveTab('myListings');
  };

  const handlePurchaseComplete = async () => {
    // Reload listings after purchase
    await loadListings();
  };

  return (
    <div className="marketplace">
      <header className="marketplace-header">
        <div className="header-top">
          <img src="/logo.png" alt="MineShare" className="marketplace-logo" />
          
          {currentAccount && (
            <div className="header-center">
              <input
                type="text"
                placeholder="🔍 Search by dataset ID, seller address, or price..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="header-search"
              />
              <nav className="header-nav">
                <button 
                  className={`nav-btn ${activeTab === 'browse' ? 'active' : ''}`}
                  onClick={() => setActiveTab('browse')}
                >
                  🔍 Browse Listings
                </button>
                <button 
                  className={`nav-btn ${activeTab === 'myListings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('myListings')}
                >
                  📊 My Listings ({myListings.length})
                </button>
                <button 
                  className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`}
                  onClick={() => setActiveTab('create')}
                >
                  ➕ Create Listing
                </button>
              </nav>
            </div>
          )}
          
          <div className="header-actions">
            <ConnectButton />
          </div>
        </div>
      </header>

      <div className="marketplace-title-section">
        <h1>MineShare</h1>
        <p className="tagline">A decentralized data marketplace</p>
      </div>

      {!currentAccount ? (
        <div className="connect-prompt">
          <div className="connect-card">
            <h2>Connect Your Wallet</h2>
            <p>Connect your Sui wallet to browse, buy, and sell data on the marketplace</p>
            <div className="wallet-benefits">
              <div className="benefit">✅ Browse data listings</div>
              <div className="benefit">✅ Purchase datasets with SUI</div>
              <div className="benefit">✅ List your own data for sale</div>
              <div className="benefit">✅ Secure blockchain transactions</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <main className="marketplace-content">
            {activeTab === 'browse' && (
              <div className="listings-grid">
                {isLoadingListings ? (
                  <div className="empty-state">
                    <h3>Loading listings...</h3>
                  </div>
                ) : filteredBrowseListings.length === 0 ? (
                  <div className="empty-state">
                    <h3>{searchQuery ? 'No listings match your search' : 'No listings available'}</h3>
                    <p>{searchQuery ? 'Try a different search term' : 'Be the first to list your data!'}</p>
                  </div>
                ) : (
                  filteredBrowseListings.map(listing => (
                    <ListingCard 
                      key={listing.id} 
                      listing={listing}
                      currentAccount={currentAccount}
                      onPurchase={handlePurchaseComplete}
                      signAndExecuteTransaction={signAndExecuteTransaction}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'myListings' && (
              <div className="listings-grid">
                {isLoadingListings ? (
                  <div className="empty-state">
                    <h3>Loading your listings...</h3>
                  </div>
                ) : filteredMyListings.length === 0 ? (
                  <div className="empty-state">
                    <h3>{searchQuery ? 'No listings match your search' : "You haven't created any listings yet"}</h3>
                    <p>{searchQuery ? 'Try a different search term' : 'Click "Create Listing" to start selling your data'}</p>
                  </div>
                ) : (
                  filteredMyListings.map(listing => (
                    <ListingCard 
                      key={listing.id} 
                      listing={listing}
                      currentAccount={currentAccount}
                      isOwner={true}
                      onCollect={handlePurchaseComplete}
                      signAndExecuteTransaction={signAndExecuteTransaction}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <CreateListing 
                currentAccount={currentAccount}
                onListingCreated={handleListingCreated}
              />
            )}
          </main>
        </>
      )}

      <footer className="marketplace-footer">
        <p>Powered by Sui Blockchain & Walrus Storage</p>
      </footer>
    </div>
  );
}

export default Marketplace;
