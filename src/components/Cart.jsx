import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2, Package, MessageCircle, CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePaystackPayment } from 'react-paystack';
import { useShop } from '../context/ShopContext';

export default function Cart({ isOpen, closeCart, items, onRemove, onUpdateQuantity, clearCart }) {
  const { createOrder, user } = useShop(); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [email] = useState(user?.email || 'customer@spotlexworld.com');
  const [orderReference, setOrderReference] = useState(`ORD-${new Date().getTime()}`);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // --- WhatsApp Checkout Logic ---
  const handleWhatsAppCheckout = async () => {
    setIsProcessing(true);
    try {
      await createOrder(items, subtotal, 'whatsapp');

      const phoneNumber = '2348032097795';
      let message = `Hello Spotlex Shop, I would like to place an order:\n\n`;
      items.forEach(item => { message += `• ${item.quantity}x ${item.name} - ₦${(item.price * item.quantity).toLocaleString()}\n`; });
      message += `\n*Subtotal: ₦${subtotal.toLocaleString()}*\n\nPlease let me know the total including shipping and payment details.`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      clearCart();
      closeCart();
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Paystack Checkout Logic ---
  const paystackConfig = {
    reference: orderReference,
    email: email,
    amount: subtotal * 100, // Paystack requires amount in Kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    currency: 'NGN',
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const onPaystackSuccess = () => {
    // The backend Webhook handles stock deductions and Zoho sync automatically!
    toast.success('Payment successful! Your order is being processed.');
    clearCart();
    closeCart();
    setOrderReference(`ORD-${new Date().getTime()}`); // Regenerate for the next order
    setIsProcessing(false);
  };

  const onPaystackClose = () => {
    toast.error('Payment window closed. You have not been charged.');
    setIsProcessing(false);
  };

  const handlePaystackCheckout = async () => {
    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      toast.error("Paystack API Key is missing. Please configure your .env file.");
      return;
    }
    setIsProcessing(true);
    try {
      // Create a pending order in the database FIRST
      await createOrder(items, subtotal, 'paystack', orderReference);
      // Trigger Paystack Popup
      initializePayment(onPaystackSuccess, onPaystackClose);
    } catch (error) {
      toast.error('Failed to initialize secure checkout.');
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCart} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50" />
          
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Your Bag</h2>
              <button onClick={closeCart} className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

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
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-300" />}
                      </div>
                      <div className="flex-1 flex flex-col py-0.5">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-medium text-gray-900 pr-2 leading-tight line-clamp-2">{item.name}</h3>
                          <button onClick={() => onRemove(item.id)} className="p-1.5 -mr-1.5 -mt-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <p className="text-xs text-gray-500 mb-auto">₦{Number(item.price).toLocaleString()} / unit</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                            <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                          <span className="text-sm font-semibold text-brand-600">₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-100 p-6 bg-gray-50 shrink-0">
                <div className="flex justify-between text-base font-semibold text-gray-900 mb-4"><p>Subtotal</p><p>₦{subtotal.toLocaleString()}</p></div>
                
                <div className="space-y-3">
                  <button onClick={handlePaystackCheckout} disabled={isProcessing} className="w-full bg-brand-600 text-white py-4 rounded-xl font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 group disabled:opacity-70">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" /> Checkout Securely</>}
                  </button>

                  <div className="flex items-center gap-4 my-2 opacity-60">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">OR</span>
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>

                  <button onClick={handleWhatsAppCheckout} disabled={isProcessing} className="w-full bg-white border-2 border-gray-200 text-gray-900 py-3 rounded-xl font-medium hover:border-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/5 transition-all flex items-center justify-center gap-2 group disabled:opacity-70">
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> Order via WhatsApp
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}