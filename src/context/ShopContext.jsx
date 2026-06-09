import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleDbError = (error, fallbackMessage) => {
    console.error(error);
    if (error.message?.includes('row-level security') || error.code === '42501') {
      toast.error('Permission Denied: Database security policies are blocking this.');
    } else if (error.message) {
      toast.error(`Database Error: ${error.message}`);
    } else {
      toast.error(fallbackMessage);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured.');
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchDatabase();
    return () => subscription?.unsubscribe();
  }, []);

  // Fetch Orders only if logged in as Admin
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchDatabase = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('created_at', { ascending: true })
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      handleDbError(error, 'Failed to load shop data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to load orders", error);
    }
  };

  // --- ORDER MODERATION FLOW ---

  // 1. Customer creates an order (Before WhatsApp)
  const createOrder = async (cartItems, subtotal, method = 'whatsapp') => {
    try {
      const { data, error } = await supabase.from('orders').insert([{
        items: cartItems,
        subtotal: subtotal,
        payment_method: method,
        status: 'pending'
      }]).select().single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDbError(error, 'Failed to initialize order.');
      throw error;
    }
  };

  // 2. Admin approves the order (Deducts stock)
  const approveOrder = async (orderId, orderItems) => {
    try {
      // Step A: Mark Order as Paid
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);
      
      if (orderError) throw orderError;

      // Step B: Deduct Stock for each item in the database
      for (const item of orderItems) {
        const { data: currentProduct } = await supabase.from('products').select('stock_quantity').eq('id', item.id).single();
        if (currentProduct) {
          const newStock = Math.max(0, currentProduct.stock_quantity - item.quantity);
          await supabase.from('products').update({ stock_quantity: newStock }).eq('id', item.id);
        }
      }

      // Refresh state
      toast.success('Payment confirmed & stock deducted!');
      fetchOrders();
      fetchDatabase();
    } catch (error) {
      handleDbError(error, 'Failed to approve order.');
    }
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addProduct = async (productData, imageFile) => { /* ... existing code ... */ };
  const updateProduct = async (id, productData, imageFile) => { /* ... existing code ... */ };
  const deleteProduct = async (id) => { /* ... existing code ... */ };
  const addCategory = async (name) => { /* ... existing code ... */ };
  const deleteCategory = async (id) => { /* ... existing code ... */ };

  return (
    <ShopContext.Provider value={{
      products, categories, orders, loading, user, login, logout,
      addProduct, updateProduct, deleteProduct, addCategory, deleteCategory,
      createOrder, approveOrder
    }}>
      {children}
    </ShopContext.Provider>
  );
};