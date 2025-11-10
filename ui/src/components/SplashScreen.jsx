import React from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onNext }) => {
    return (
        <div className="splash-screen">
            <h1>Welcome to MineShare!</h1>
            <p>Loading...</p>
            <button onClick={onNext}>Continue</button>
        </div>
    );
};

export default SplashScreen;
