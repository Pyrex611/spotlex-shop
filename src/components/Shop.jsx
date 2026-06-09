import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PackageX, Loader2, Search, X, Package, ShoppingBag, ArrowDownUp, Truck, Leaf, ShieldCheck, Plus, Minus } from 'lucide-react';
import { useShop } from '../context/ShopContext';

const slides = [
  "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=1600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1584820927498-cafe2c11866e?q=80&w=1600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1527515637-ed2fc9ce722f?q=80&w=1600&auto=format&fit=crop"  
];

// Pre-define trust cards to easily duplicate them for the Marquee
const trustCards = [
  { id: 1, icon: Truck, title: "Nationwide Delivery", desc: "Fast, secure shipping across Nigeria." },
  { id: 2, icon: Leaf, title: "Eco-Friendly", desc: "Non-toxic, plant-derived solutions." },
  { id: 3, icon: ShieldCheck, title: "Professional Grade", desc: "Commercial-quality hardware built to last." }
];

export default function Shop({ cartItems, onAddToCart, onUpdateQuantity }) {
  const { products, categories, loading } = useShop();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const introTimer = setTimeout(() => setShowIntro(false), 3500); 
    return () => clearTimeout(introTimer);
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
    <div className="bg-gray-50 min-h-screen pb-16 md:pb-24 pt-24 md:pt-28 overflow-hidden">
      
      {/* 1. Introductory Text */}
      <AnimatePresence>
        {showIntro && (
          <motion.section 
            initial={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="px-6 md:px-12 max-w-4xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              Spotlexworld Environmental Solutions<br className="hidden md:block"/> Cleaning Provisions Store
            </h1>
            <p className="text-gray-500 text-base md:text-lg pb-4">
              Equip yourself with the exact tools our professionals use. Browse our curated selection of eco-friendly solutions, durable hardware, and state-of-the-art vacuums.
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 2. Shop Hero Slideshow */}
      <section className="px-4 sm:px-6 md:px-12 max-w-7xl mx-auto mb-8">
        <div className="relative w-full h-48 sm:h-64 md:h-[400px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl bg-gray-900">
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
            <h2 className="text-white text-xl sm:text-2xl md:text-4xl font-bold tracking-widest uppercase drop-shadow-lg text-center px-4">Spotlex Supply</h2>
          </div>
        </div>
      </section>

      {/* 3. Trust Cards (Continuous Infinite Marquee) */}
      <section className="max-w-[100vw] mx-auto mb-10 md:mb-12 relative overflow-hidden">
        {/* Fading Edges for aesthetic */}
        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
        
        <motion.div 
          className="flex w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 15, repeat: Infinity }}
        >
          {/* We render the array twice so it loops perfectly without snapping */}
          {[...trustCards, ...trustCards].map((card, index) => (
            <div key={index} className="w-[280px] md:w-[350px] mx-2 md:mx-3 bg-white p-4 md:p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0 text-brand-600">
                <card.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900">{card.title}</h3>
                <p className="text-gray-500 text-xs md:text-sm line-clamp-1 mt-0.5">{card.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* 4. Catalog Section */}
      <section id="catalog" className="px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          
          <div className="flex overflow-x-auto hide-scrollbar gap-2 md:gap-3 pb-2 w-full md:w-auto">
            <button onClick={() => setActiveCategory('All')} className={`whitespace-nowrap px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all ${activeCategory === 'All' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>All</button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`whitespace-nowrap px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all ${activeCategory === c.id ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>{c.name}</button>
            ))}
          </div>

          <div className="flex w-full md:w-auto gap-2 sm:gap-3 flex-row items-center">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-8 py-2 md:py-2.5 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-brand-500 outline-none text-xs md:text-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X className="w-3.5 h-3.5" /></button>}
            </div>
            
            <div className="relative shrink-0 flex items-center group">
              <div className="flex sm:hidden items-center justify-center w-[36px] h-[36px] bg-white border border-gray-200 rounded-full shadow-sm"><ArrowDownUp className="w-3.5 h-3.5 text-gray-600" /></div>
              <div className="hidden sm:block absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><ArrowDownUp className="w-4 h-4 text-gray-400" /></div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="absolute sm:relative inset-0 w-full h-full opacity-0 sm:opacity-100 sm:w-auto appearance-none sm:pl-10 sm:pr-8 sm:py-2.5 bg-white sm:border border-gray-200 rounded-full outline-none text-sm font-medium text-gray-700">
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>
        ) : processedProducts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
            <PackageX className="w-8 h-8 text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-500 text-sm">No items match your search.</p>
          </motion.div>
        ) : (
          /* Mobile: grid-cols-2, Desktop: grid-cols-3 or 4 */
          <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
            <AnimatePresence>
              {processedProducts.map((product) => {
                const cartItem = cartItems.find(item => item.id === product.id);
                const isOutOfStock = product.stock_quantity <= 0;

                return (
                  <motion.div 
                    key={product.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                    className={`group bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-gray-100 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/10 transition-all flex flex-col relative ${isOutOfStock ? 'opacity-75 grayscale-[0.2]' : ''}`}
                  >
                    <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex flex-col gap-1 pointer-events-none">
                      {isNewArrival(product.created_at) && !isOutOfStock && <div className="bg-brand-500 text-white text-[8px] md:text-[10px] font-bold uppercase px-2 py-1 rounded-full shadow-sm">New</div>}
                      {isOutOfStock && <div className="bg-gray-800 text-white text-[8px] md:text-[10px] font-bold uppercase px-2 py-1 rounded-full shadow-sm">Empty</div>}
                    </div>

                    <Link to={`/product/${product.id}`} className="relative h-32 sm:h-48 md:h-64 w-full overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center p-2 cursor-pointer">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300"><Package className="w-8 h-8 md:w-12 md:h-12 mb-1 opacity-50" /></div>
                      )}
                    </Link>

                    <div className="p-3 md:p-5 flex flex-col flex-grow border-t border-gray-50">
                      <Link to={`/product/${product.id}`} className="mb-1 cursor-pointer hover:text-brand-600 transition-colors">
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm md:text-lg leading-tight line-clamp-2">{product.name}</h3>
                      </Link>
                      
                      <div className="mt-auto pt-2 md:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <span className="font-bold text-brand-600 text-sm sm:text-base md:text-xl">₦{Number(product.price).toLocaleString()}</span>
                        
                        {cartItem ? (
                          <div className="flex items-center bg-gray-50 rounded-md md:rounded-lg border border-gray-200 p-0.5 w-fit">
                            <button onClick={() => onUpdateQuantity(product.id, -1)} className="p-1 md:p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"><Minus className="w-3 h-3 md:w-4 md:h-4" /></button>
                            <span className="w-5 md:w-8 text-center text-xs md:text-sm font-semibold text-gray-900">{cartItem.quantity}</span>
                            <button onClick={() => onUpdateQuantity(product.id, 1)} disabled={cartItem.quantity >= product.stock_quantity} className="p-1 md:p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-30"><Plus className="w-3 h-3 md:w-4 md:h-4" /></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => onAddToCart(product)} disabled={isOutOfStock}
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-xl text-[10px] md:text-sm font-medium transition-all flex items-center justify-center w-full sm:w-auto gap-1.5 ${isOutOfStock ? 'bg-gray-200 text-gray-500' : 'bg-gray-900 text-white hover:bg-brand-600 shadow-md'}`}
                          >
                            <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" /> {isOutOfStock ? 'Out' : 'Add'}
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