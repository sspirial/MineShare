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
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    loadListings();
    // Refresh listings every 10 seconds
    const interval = setInterval(loadListings, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadListings = async () => {
    try {
      setIsLoadingListings(true);
      const blockchainListings = await getAllListings();
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
        <div className="header-content">
          <h1>🌐 MineShare Marketplace</h1>
          <p className="tagline">Decentralized Data Trading Platform</p>
        </div>
        <div className="header-actions">
          <ConnectButton />
        </div>
      </header>

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
          <nav className="marketplace-nav">
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

          <main className="marketplace-content">
            {activeTab === 'browse' && (
              <div className="listings-grid">
                {isLoadingListings ? (
                  <div className="empty-state">
                    <h3>Loading listings...</h3>
                  </div>
                ) : browseListings.length === 0 ? (
                  <div className="empty-state">
                    <h3>No listings available</h3>
                    <p>Be the first to list your data!</p>
                  </div>
                ) : (
                  browseListings.map(listing => (
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
                ) : myListings.length === 0 ? (
                  <div className="empty-state">
                    <h3>You haven't created any listings yet</h3>
                    <p>Click "Create Listing" to start selling your data</p>
                  </div>
                ) : (
                  myListings.map(listing => (
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
