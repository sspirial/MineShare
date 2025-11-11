import React from 'react';

const Header = ({ title, logoSize = 24 }) => {
  return (
    <div className="header" style={{
      background: 'linear-gradient(135deg, var(--color-brand-secondary) 0%, var(--color-secondary-hover) 100%)',
      padding: 'var(--spacing-md)',
      textAlign: 'center',
      boxShadow: 'var(--shadow-gold-sm)',
      borderBottom: '3px solid var(--color-brand-primary)'
    }}>
      <h1 className="logo" style={{
        fontFamily: 'var(--font-family-header)',
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--color-brand-primary)',
        margin: 0,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-xs)',
        letterSpacing: '1px'
      }}>
        <img 
          className="logo-icon" 
          src="../../assets/icons/new icons/favicon-32x32.png" 
          alt="MineShare logo" 
          width={logoSize} 
          height={logoSize}
          style={{ display: 'inline-block', verticalAlign: 'middle' }}
        />
        {title || 'MineShare'}
      </h1>
    </div>
  );
};

export default Header;
