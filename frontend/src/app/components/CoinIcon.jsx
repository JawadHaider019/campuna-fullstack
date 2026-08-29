import React from 'react';

/**
 * A responsive, transparent 3D golden coin icon for Campuna Credits (CC).
 */
export default function CoinIcon({ className = "w-5 h-5" }) {
  return (
    <img
      src="/coin.png"
      className={className}
      alt="Campuna Credit Coin"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
}
