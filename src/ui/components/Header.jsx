import React from 'react';

const Header = ({ title, logoSize = 24 }) => {
  return (
    <div className="header" style={{
      background: 'linear-gradient(135deg, var(--gold) 0%, #FFC700 100%)',
      padding: '16px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
    }}>
      <h1 className="logo" style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: '22px',
        fontWeight: 700,
        color: 'var(--purple)',
        margin: 0,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
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
