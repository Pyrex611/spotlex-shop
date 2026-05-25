import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageX, Loader2, Search, X, Package, ShoppingBag, ArrowDownUp } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function Shop({ onAddToCart }) {
  const { products, categories, loading } = useShop();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Date threshold for "New" badge (7 days ago)
  const isNewArrival = (dateString) => {
    if (!dateString) return false;
    const itemDate = new Date(dateString);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return itemDate >= sevenDaysAgo;
  };

  // Combine Search, Category Filter, and Sorting logic
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
        // Default to newest
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [products, activeCategory, searchQuery, sortBy]);

  return (
    <section id="shop" className="py-16 md:py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 md:mb-10 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">Spotlex Equipment</h2>
            <p className="text-gray-500 text-base md:text-lg">Premium grade tools and eco-friendly solutions for the purest clean.</p>
          </div>
        </div>

        {/* E-commerce Control Bar (Pills + Search + Sort) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          
          {/* Category Pills Menu */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 md:gap-3 pb-2 -mx-6 px-6 md:mx-0 md:px-0 w-full md:w-auto">
            <button
              onClick={() => setActiveCategory('All')}
              className={`whitespace-nowrap px-5 py-2 md:px-6 md:py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === 'All' 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap px-5 py-2 md:px-6 md:py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === category.id 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Search & Sort Utilities */}
          <div className="flex w-full md:w-auto gap-3">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative shrink-0">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <ArrowDownUp className="w-4 h-4 text-gray-400" />
              </div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none shadow-sm text-sm font-medium text-gray-700 cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          </div>
        ) : (
          /* Product Grid with Empty State Fallback */
          processedProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 md:py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <PackageX className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? `We couldn't find anything matching "${searchQuery}".` 
                  : "There are currently no items available in this category."}
              </p>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              <AnimatePresence>
                {processedProducts.map((product) => (
                  <motion.div 
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col relative"
                  >
                    {/* Badge */}
                    {isNewArrival(product.created_at) && (
                      <div className="absolute top-4 left-4 z-10 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                        New
                      </div>
                    )}

                    {/* Image Container */}
                    <div className="relative h-56 md:h-64 w-full overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center p-4">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                           <Package className="w-12 h-12 mb-2 opacity-50" />
                           <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                        </div>
                      )}

                      {/* Explicit "Add to Cart" CTA Button (Visible on mobile by default, Slide-up on desktop) */}
                      <div className="absolute bottom-4 left-4 right-4 lg:opacity-0 lg:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                        <button 
                          onClick={() => onAddToCart(product)}
                          className="w-full bg-gray-900/90 backdrop-blur-md text-white py-3 rounded-xl font-medium shadow-lg flex items-center justify-center gap-2 hover:bg-brand-600 transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Add to Cart
                        </button>
                      </div>
                    </div>

                    {/* Details Container */}
                    <div className="p-5 md:p-6 flex flex-col flex-grow border-t border-gray-50">
                      <div className="mb-2">
                        <h3 className="font-semibold text-gray-900 text-base md:text-lg leading-snug line-clamp-2">{product.name}</h3>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow">{product.description}</p>
                      <div className="mt-auto">
                        <span className="font-bold text-brand-600 text-lg md:text-xl">₦{Number(product.price).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )
        )}
      </div>
    </section>
  );
}