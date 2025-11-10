import { useState } from 'react';
import './ListingCard.css';
import { buyListing, claimDataset, collectProceeds } from '../api/sui_api';
import { downloadFromWalrus, bytesToBlobId } from '../api/walrus_api';

function ListingCard({ listing, isOwner, currentAccount, onPurchase, onCollect, signAndExecuteTransaction }) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [message, setMessage] = useState('');
  const [purchasedData, setPurchasedData] = useState(null);

  const handlePurchase = async () => {
    if (!currentAccount) {
      setMessage('Please connect your wallet');
      return;
    }

    setIsPurchasing(true);
    setMessage('');

    try {
      setMessage('💳 Processing purchase...');

      // Buy the listing
      const buyResult = await buyListing(
        listing.id,
        listing.price,
        { signAndExecuteTransactionBlock: signAndExecuteTransaction },
        currentAccount.address
      );

      setMessage('✅ Purchase successful! Claiming dataset...');

      // Automatically claim the dataset
      await handleClaim();

      if (onPurchase) {
        onPurchase();
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setMessage('❌ Purchase failed: ' + error.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    setMessage('');

    try {
      setMessage('📦 Claiming dataset...');

      // Claim the dataset
      const claimResult = await claimDataset(
        listing.id,
        { signAndExecuteTransactionBlock: signAndExecuteTransaction },
        currentAccount.address
      );

      setMessage('✅ Dataset claimed! Downloading data...');

      // Get the CID from the dataset
      const blobId = bytesToBlobId(listing.dataset.fields.cid);

      // Check if user has encryption key (from extension exports)
      // For now, show instructions to user
      setMessage('✅ Dataset received! Use the extension to decrypt with your key.');

      // In a full implementation, you'd:
      // 1. Get encryption key from user or local storage
      // 2. Download and decrypt: const data = await downloadFromWalrus(blobId, encryptionKey);
      // 3. setPurchasedData(data);

    } catch (error) {
      console.error('Claim error:', error);
      setMessage('❌ Claim failed: ' + error.message);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCollectProceeds = async () => {
    setIsCollecting(true);
    setMessage('');

    try {
      setMessage('💰 Collecting proceeds...');

      const result = await collectProceeds(
        listing.id,
        { signAndExecuteTransactionBlock: signAndExecuteTransaction }
      );

      setMessage('✅ Proceeds collected! Check your wallet.');

      if (onCollect) {
        onCollect();
      }
    } catch (error) {
      console.error('Collect error:', error);
      setMessage('❌ Collection failed: ' + error.message);
    } finally {
      setIsCollecting(false);
    }
  };

  // Calculate balance in SUI (from MIST)
  const balanceInSui = listing.balance ? parseInt(listing.balance) / 1_000_000_000 : 0;

  return (
    <div className="listing-card">
      <div className="listing-header">
        <span className="data-type">{listing.dataset?.fields?.meta ? 'Dataset' : 'Data'}</span>
        <span className={`status ${listing.sold ? 'sold' : 'listed'}`}>
          {listing.sold ? 'Sold' : 'Listed'}
        </span>
      </div>
      
      <h3 className="listing-title">
        Dataset {listing.id.slice(0, 8)}...
      </h3>
      <p className="listing-description">
        {listing.dataset?.fields?.meta 
          ? (() => {
              try {
                const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(listing.dataset.fields.meta)));
                return `${meta.domains} domains, ${meta.events} events`;
              } catch {
                return 'Encrypted browsing data';
              }
            })()
          : 'Encrypted browsing data'}
      </p>
      
      <div className="listing-stats">
        <div className="stat">
          <span className="stat-label">Seller:</span>
          <span className="stat-value">{listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</span>
        </div>
        {isOwner && balanceInSui > 0 && (
          <div className="stat">
            <span className="stat-label">Balance:</span>
            <span className="stat-value">{balanceInSui.toFixed(4)} SUI</span>
          </div>
        )}
      </div>
      
      {message && (
        <div className="listing-message" style={{
          fontSize: '12px',
          padding: '8px',
          margin: '8px 0',
          borderRadius: '4px',
          background: message.startsWith('❌') ? '#fee' : message.startsWith('✅') ? '#efe' : '#ffa',
          border: '1px solid ' + (message.startsWith('❌') ? '#fcc' : message.startsWith('✅') ? '#cfc' : '#fc0')
        }}>
          {message}
        </div>
      )}
      
      <div className="listing-footer">
        <div className="price">
          <span className="price-label">Price:</span>
          <span className="price-value">{listing.price} SUI</span>
        </div>
        
        {!isOwner && !listing.sold && (
          <button 
            className="purchase-btn" 
            onClick={handlePurchase}
            disabled={isPurchasing || isClaiming}
          >
            {isPurchasing ? 'Purchasing...' : isClaiming ? 'Claiming...' : 'Purchase'}
          </button>
        )}
        
        {isOwner && listing.sold && balanceInSui > 0 && (
          <button 
            className="purchase-btn" 
            onClick={handleCollectProceeds}
            disabled={isCollecting}
            style={{ background: '#28a745' }}
          >
            {isCollecting ? 'Collecting...' : `Collect ${balanceInSui.toFixed(4)} SUI`}
          </button>
        )}
        
        {isOwner && !listing.sold && (
          <div className="owner-badge">Your Listing</div>
        )}
        
        {isOwner && listing.sold && balanceInSui === 0 && (
          <div className="owner-badge" style={{ background: '#6c757d' }}>Collected</div>
        )}
      </div>
    </div>
  );
}

export default ListingCard;
