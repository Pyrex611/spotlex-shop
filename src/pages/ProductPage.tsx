import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Loader2, ArrowLeft, Package, ShoppingBag, Plus, Minus, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductPage({ cartItems, onAddToCart, onUpdateQuantity }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading, categories } = useShop();

  const product = products.find(p => p.id === id);
  const cartItem = cartItems.find(item => item?.id === id);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20"><Loader2 className="w-10 h-10 text-brand-500 animate-spin" /></div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pt-20 text-center px-6">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The equipment you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/shop')} className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-brand-600 transition-colors">Return to Shop</button>
      </div>
    );
  }

  const categoryName = categories.find(c => c.id === product.category_id)?.name || 'Uncategorized';

  return (
    <div className="bg-gray-50 min-h-screen pb-24 pt-24 md:pt-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Catalog
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:flex-row"
        >
          {/* Image Gallery Side */}
          <div className="w-full lg:w-1/2 bg-gray-50 p-8 md:p-12 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100 min-h-[300px]">
             {product.image ? (
                <img src={product.image} alt={product.name} className="w-full max-w-md object-contain mix-blend-multiply" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                   <Package className="w-24 h-24 mb-4 opacity-50" />
                   <span className="text-sm font-medium uppercase tracking-wider">Image Unavailable</span>
                </div>
              )}
          </div>

          {/* Product Details Side */}
          <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col">
            <span className="text-brand-600 font-semibold tracking-wider text-xs uppercase mb-3">{categoryName}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-4">{product.name}</h1>
            <span className="text-3xl font-bold text-gray-900 mb-8">₦{Number(product.price).toLocaleString()}</span>
            
            <div className="prose prose-gray mb-10">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-500 leading-relaxed">{product.description}</p>
            </div>

            <div className="mt-auto pt-8 border-t border-gray-100">
              {cartItem ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1">
                    <button onClick={() => onUpdateQuantity(product.id, -1)} className="p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"><Minus className="w-5 h-5" /></button>
                    <span className="w-12 text-center text-lg font-semibold text-gray-900">{cartItem.quantity}</span>
                    <button onClick={() => onUpdateQuantity(product.id, 1)} className="p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"><Plus className="w-5 h-5" /></button>
                  </div>
                  <div className="flex items-center gap-2 text-brand-600 font-medium">
                    <CheckCircle className="w-5 h-5" /> Added to your bag
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => onAddToCart(product)}
                  className="w-full sm:w-auto bg-gray-900 text-white px-8 py-4 rounded-xl text-base font-medium shadow-lg hover:bg-brand-600 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" /> Add to Bag
                </button>
              )}
            </div>
            
            {/* Trust Mini-badges */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-gray-600"/></div>
                 <span className="text-xs font-medium text-gray-600">Secure Checkout</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-gray-600"/></div>
                 <span className="text-xs font-medium text-gray-600">Nationwide Delivery</span>
               </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}