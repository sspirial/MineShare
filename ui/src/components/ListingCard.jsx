import React from 'react';

const ListingCard = ({ listing, isOwn = false, onDelete, onPurchase }) => {
  const sellerId = listing.sellerId?.substring(0, 10) + '...' + listing.sellerId?.slice(-8);
  const date = new Date(listing.createdAt).toLocaleDateString();

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div className="card-title" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)' }}>
          {listing.title}
        </div>
        {isOwn && listing.status && (
          <span className={`badge ${listing.status}`}>{listing.status}</span>
        )}
        {!isOwn && (
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
            ${listing.price?.toFixed(2)}
          </div>
        )}
      </div>
      
      <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 8px' }}>
        {listing.description}
      </p>
      
      <div className="card-meta" style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
        <div>📊 {listing.dataType} • {listing.dataSize} events</div>
        <div>📅 {listing.timeRange}</div>
        {!isOwn && <div>👤 Seller: {sellerId}</div>}
        {isOwn && <div>💰 Price: ${listing.price?.toFixed(2)} • Created: {date}</div>}
      </div>
      
      {(isOwn && listing.status === 'listed' && onDelete) || (!isOwn && onPurchase) ? (
        <div className="card-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {isOwn && listing.status === 'listed' && onDelete && (
            <button 
              onClick={() => onDelete(listing.id)} 
              className="danger"
              style={{ flex: 1, fontSize: '12px', padding: '8px 14px' }}
            >
              Delete Listing
            </button>
          )}
          {!isOwn && onPurchase && (
            <button 
              onClick={() => onPurchase(listing)} 
              className="success"
              style={{ flex: 1, fontSize: '12px', padding: '8px 14px' }}
            >
              🛒 Buy Now
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ListingCard;
