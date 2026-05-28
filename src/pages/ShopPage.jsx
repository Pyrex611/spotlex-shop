import React from 'react';
import Shop from '../components/Shop';

export default function ShopPage({ cartItems, onAddToCart, onUpdateQuantity }) {
  return (
    <div className="w-full">
      <Shop cartItems={cartItems} onAddToCart={onAddToCart} onUpdateQuantity={onUpdateQuantity} />
    </div>
  );
}