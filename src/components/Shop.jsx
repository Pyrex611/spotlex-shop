import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PackageX } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function Shop({ onAddToCart }) {
  const { products, categories } = useShop();
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(product => product.categoryId === activeCategory);

  return (
    <section id="shop" className="py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">Spotlex Equipment</h2>
            <p className="text-gray-500 text-lg">Professional-grade tools and eco-friendly solutions to maintain the pure clean.</p>
          </div>
        </div>

        {/* E-commerce Category Pills Menu */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-12 pb-2">
          <button
            onClick={() => setActiveCategory('All')}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
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
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category.id 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Product Grid with Empty State Fallback */}
        {filteredProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <PackageX className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">There are currently no items available in this category.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 flex flex-col"
                >
                  <div className="relative h-64 overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <button 
                      onClick={() => onAddToCart(product)}
                      className="absolute bottom-4 right-4 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-brand-500 hover:scale-110 shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight pr-4">{product.name}</h3>
                        <span className="font-medium text-brand-600 whitespace-nowrap">₦{Number(product.price).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{product.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}