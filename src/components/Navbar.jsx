import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ cartCount, openCart }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'glass-nav py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/spotlex_logo.jpg" alt="Spotlex Logo" className="w-9 h-9 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
          <span className="text-xl font-semibold tracking-tight text-gray-900">Spotlex Shop</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-900'}`}>Home</Link>
          <Link to="/shop" className={`text-sm font-medium transition-colors ${location.pathname === '/shop' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-900'}`}>Equipment Shop</Link>
          <Link to="/admin" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"><LayoutDashboard className="w-4 h-4"/> Admin</Link>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={openCart} className="relative group p-2">
            <ShoppingBag className="w-5 h-5 text-gray-700 group-hover:text-brand-500 transition-colors" />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
          
          <button className="md:hidden p-2 text-gray-700" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 w-full bg-white shadow-xl flex flex-col p-6 z-50 md:hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <img src="/spotlex_logo.jpg" alt="Spotlex Logo" className="w-8 h-8 rounded-full object-cover" />
                <span className="text-xl font-semibold tracking-tight text-gray-900">Spotlex</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              <Link to="/" className="text-lg font-medium text-gray-800 hover:text-brand-600 transition-colors">Home</Link>
              <Link to="/shop" className="text-lg font-medium text-gray-800 hover:text-brand-600 transition-colors">Equipment Shop</Link>
              <Link to="/admin" className="text-lg font-medium text-gray-800 hover:text-brand-600 transition-colors">Admin Dashboard</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}