import React, { useState } from 'react';
import './WalletConnect.css';

const WalletConnect = ({ onConnected }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const connectWallet = async () => {
        setIsConnecting(true);
        setError('');
        
        try {
            const result = await window.MarketplaceAPI.wallet.connect();
            if (result.success) {
                console.log('Wallet connected:', result.address);
                if (onConnected) {
                    onConnected(result.address);
                }
            } else {
                setError(result.error || 'Failed to connect wallet');
            }
        } catch (err) {
            setError('An error occurred while connecting: ' + err.message);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="wallet-connect">
            <div className="wallet-connect-content">
                <h1>Connect Your Wallet</h1>
                <p>To access MineShare features, please connect your wallet.</p>
                
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                
                <button 
                    className="connect-btn" 
                    onClick={connectWallet}
                    disabled={isConnecting}
                >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
            </div>
        </div>
    );
};

export default WalletConnect;
