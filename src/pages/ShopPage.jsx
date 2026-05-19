import React from 'react';
import Shop from '../components/Shop';

export default function ShopPage({ onAddToCart }) {
  return (
    <div className="w-full pt-20">
      <Shop onAddToCart={onAddToCart} />
    </div>
  );
}