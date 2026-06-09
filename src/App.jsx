import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cart from './components/Cart';
import Home from './pages/Home';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('spotlex_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Cart storage corrupted, resetting cart.');
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('spotlex_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const hideNavAndFooter = location.pathname.startsWith('/admin');

  return (
    <div className="relative w-full min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />
      <Analytics />
      
      {!hideNavAndFooter && (
        <Navbar 
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
          openCart={() => setIsCartOpen(true)} 
        />
      )}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<ShopPage cartItems={cartItems} onAddToCart={addToCart} onUpdateQuantity={updateQuantity} />} />
          <Route path="/product/:id" element={<ProductPage cartItems={cartItems} onAddToCart={addToCart} onUpdateQuantity={updateQuantity} />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {!hideNavAndFooter && <Footer />}

      <Cart 
        isOpen={isCartOpen} 
        closeCart={() => setIsCartOpen(false)} 
        items={cartItems} 
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        clearCart={clearCart}
      />
    </div>
  );
}

export default App;