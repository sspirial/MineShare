import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className={`modal-overlay ${isOpen ? 'active' : ''}`}
      style={{
        display: isOpen ? 'flex' : 'none',
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 26, 26, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease'
      }}
      onClick={onClose}
    >
      <div 
        className="modal"
        style={{
          background: 'white',
          borderRadius: 'var(--border-radius)',
          padding: '24px',
          maxWidth: '380px',
          width: '90%',
          maxHeight: '500px',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '3px solid var(--gold)',
          animation: 'modalSlideIn 0.3s ease'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            paddingBottom: '12px',
            borderBottom: '2px solid var(--gold)'
          }}
        >
          <h3 
            className="modal-title"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--purple)',
              margin: 0
            }}
          >
            {title}
          </h3>
          <button 
            className="modal-close"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              padding: 0,
              width: '32px',
              height: '32px',
              lineHeight: 1,
              color: 'var(--purple)',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
