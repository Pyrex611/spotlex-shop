import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2, Package, MessageCircle } from 'lucide-react';

export default function Cart({ isOpen, closeCart, items, onRemove, onUpdateQuantity }) {
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleWhatsAppCheckout = () => {
    // Format the number to include Nigeria's country code (+234)
    const phoneNumber = '2348032097795';
    
    // Construct the WhatsApp message
    let message = `Hello Spotlex Shop, I would like to place an order for the following items:\n\n`;
    
    items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      message += `• ${item.quantity}x ${item.name} - ₦${itemTotal.toLocaleString()}\n`;
    });
    
    message += `\n*Subtotal: ₦${subtotal.toLocaleString()}*`;
    message += `\n\nPlease let me know the total including shipping and payment details.`;

    // Encode for URL usage and open in new tab/app
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50"
          />
          
          {/* Slide-out Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Your Bag
              </h2>
              <button onClick={closeCart} className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100" title="Close Cart">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                  <ShoppingBag className="w-12 h-12 text-gray-200" />
                  <p>Your bag is currently empty.</p>
                  <button onClick={closeCart} className="text-brand-600 font-medium hover:underline">Continue Shopping</button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col py-0.5">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-medium text-gray-900 pr-2 leading-tight line-clamp-2">{item.name}</h3>
                          <button onClick={() => onRemove(item.id)} className="p-1.5 -mr-1.5 -mt-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0" title="Remove item">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Unit Price Display */}
                        <p className="text-xs text-gray-500 mb-auto">₦{Number(item.price).toLocaleString()} / unit</p>
                        
                        {/* Controls & Line Total Display */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                            <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Item Total (Price * Quantity) */}
                          <span className="text-sm font-semibold text-brand-600">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 p-6 bg-gray-50 shrink-0">
                <div className="flex justify-between text-base font-semibold text-gray-900 mb-4">
                  <p>Subtotal</p>
                  <p>₦{subtotal.toLocaleString()}</p>
                </div>
                <p className="text-sm text-gray-500 mb-6">Order will be securely processed via WhatsApp.</p>
                
                {/* WhatsApp Checkout Button */}
                <button 
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-[#25D366] transition-colors shadow-lg shadow-gray-900/20 hover:shadow-[#25D366]/30 flex items-center justify-center gap-2 group"
                >
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Checkout via WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}