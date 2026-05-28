import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PackageX, Loader2, Search, X, Package, ShoppingBag, ArrowDownUp, Truck, Leaf, ShieldCheck, Plus, Minus } from 'lucide-react';
import { useShop } from '../context/ShopContext';

const slides = [
  "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=1600&auto=format&fit=crop", // Vacuum
  "https://images.unsplash.com/photo-1584820927498-cafe2c11866e?q=80&w=1600&auto=format&fit=crop", // Supplies
  "https://images.unsplash.com/photo-1527515637-ed2fc9ce722f?q=80&w=1600&auto=format&fit=crop"  // Clean Home
];

export default function Shop({ cartItems, onAddToCart, onUpdateQuantity }) {
  const { products, categories, loading } = useShop();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slideshow Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const isNewArrival = (dateString) => {
    if (!dateString) return false;
    const itemDate = new Date(dateString);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return itemDate >= sevenDaysAgo;
  };

  const processedProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesCategory = activeCategory === 'All' || product.category_id === activeCategory;
        const matchesSearch = 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [products, activeCategory, searchQuery, sortBy]);

  return (
    <div className="bg-gray-50 min-h-screen pb-16 md:pb-24 pt-24 md:pt-32">
      
      {/* 1. Introductory Text */}
      <section className="px-6 md:px-12 max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
          Spotlexworld Environmental Solutions<br className="hidden md:block"/> Cleaning Provisions Store
        </h1>
        <p className="text-gray-500 text-base md:text-lg">
          Equip yourself with the exact tools our professionals use. Browse our curated selection of eco-friendly solutions, durable hardware, and state-of-the-art vacuums.
        </p>
      </section>

      {/* 2. Shop Hero Slideshow */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto mb-12">
        <div className="relative w-full h-64 md:h-[400px] rounded-[2rem] overflow-hidden shadow-xl bg-gray-900">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentSlide}
              src={slides[currentSlide]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-white text-2xl md:text-4xl font-bold tracking-widest uppercase drop-shadow-lg">Spotlex Supply</h2>
          </div>
        </div>
      </section>

      {/* 3. Trust / Value Proposition Cards (Reduced Height, Horizontal on Mobile) */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto mb-16 md:mb-20">
        <div className="flex md:grid md:grid-cols-3 overflow-x-auto hide-scrollbar gap-4 md:gap-6 pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x snap-mandatory">
          
          <div className="min-w-[85%] sm:min-w-[60%] md:min-w-0 snap-center bg-white p-4 md:p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shrink-0">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0 text-brand-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900">Nationwide Delivery</h3>
              <p className="text-gray-500 text-xs md:text-sm line-clamp-1 md:line-clamp-2 mt-0.5">Fast, secure shipping across Nigeria.</p>
            </div>
          </div>
          
          <div className="min-w-[85%] sm:min-w-[60%] md:min-w-0 snap-center bg-white p-4 md:p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shrink-0">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0 text-brand-600">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900">Eco-Friendly</h3>
              <p className="text-gray-500 text-xs md:text-sm line-clamp-1 md:line-clamp-2 mt-0.5">Non-toxic, plant-derived solutions.</p>
            </div>
          </div>

          <div className="min-w-[85%] sm:min-w-[60%] md:min-w-0 snap-center bg-white p-4 md:p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shrink-0">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0 text-brand-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900">Professional Grade</h3>
              <p className="text-gray-500 text-xs md:text-sm line-clamp-1 md:line-clamp-2 mt-0.5">Commercial-quality hardware built to last.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Catalog Section */}
      <section id="catalog" className="px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          
          {/* Category Pills Menu */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 md:gap-3 pb-2 -mx-6 px-6 md:mx-0 md:px-0 w-full md:w-auto">
            <button
              onClick={() => setActiveCategory('All')}
              className={`whitespace-nowrap px-5 py-2 md:px-6 md:py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === 'All' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap px-5 py-2 md:px-6 md:py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === category.id ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex w-full md:w-auto gap-3 flex-col sm:flex-row">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search catalog..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none shadow-sm text-sm"
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>}
            </div>
            <div className="relative shrink-0 w-full sm:w-auto">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><ArrowDownUp className="w-4 h-4 text-gray-400" /></div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none w-full sm:w-auto pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none shadow-sm text-sm font-medium text-gray-700 cursor-pointer">
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 text-brand-500 animate-spin" /></div>
        ) : processedProducts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 md:py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><PackageX className="w-8 h-8 text-gray-400" /></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">{searchQuery ? `No match for "${searchQuery}".` : "No items available."}</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence>
              {processedProducts.map((product) => {
                const cartItem = cartItems.find(item => item.id === product.id);

                return (
                  <motion.div 
                    key={product.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                    className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col relative"
                  >
                    {isNewArrival(product.created_at) && <div className="absolute top-4 left-4 z-10 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm pointer-events-none">New</div>}

                    {/* Image Links to Product Page */}
                    <Link to={`/product/${product.id}`} className="relative h-56 md:h-64 w-full overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center p-4 cursor-pointer">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300"><Package className="w-12 h-12 mb-2 opacity-50" /><span className="text-xs font-medium uppercase tracking-wider">No Image</span></div>
                      )}
                    </Link>

                    <div className="p-5 flex flex-col flex-grow border-t border-gray-50">
                      <Link to={`/product/${product.id}`} className="mb-1 cursor-pointer hover:text-brand-600 transition-colors">
                        <h3 className="font-semibold text-gray-900 text-base md:text-lg leading-snug line-clamp-2">{product.name}</h3>
                      </Link>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow">{product.description}</p>
                      
                      {/* Price and Add/Quantity Controller Row */}
                      <div className="mt-auto flex items-center justify-between">
                        <span className="font-bold text-brand-600 text-lg md:text-xl">₦{Number(product.price).toLocaleString()}</span>
                        
                        {cartItem ? (
                          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                            <button onClick={() => onUpdateQuantity(product.id, -1)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="w-8 text-center text-sm font-semibold text-gray-900">{cartItem.quantity}</span>
                            <button onClick={() => onUpdateQuantity(product.id, 1)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => onAddToCart(product)}
                            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:bg-brand-600 hover:shadow-brand-500/20 transition-all duration-300 flex items-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}