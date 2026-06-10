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
  const createOrder = async (cartItems, subtotal, method = 'whatsapp', reference = null) => {
    try {
      const orderRef = reference || `WA-${Date.now()}`;
      const { data, error } = await supabase.from('orders').insert([{
        reference: orderRef,
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

  const approveOrder = async (orderId, orderItems) => {
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);
      
      if (orderError) throw orderError;

      for (const item of orderItems) {
        const { data: currentProduct } = await supabase.from('products').select('stock_quantity').eq('id', item.id).single();
        if (currentProduct) {
          const newStock = Math.max(0, currentProduct.stock_quantity - item.quantity);
          await supabase.from('products').update({ stock_quantity: newStock }).eq('id', item.id);
        }
      }

      toast.success('Payment confirmed & stock deducted!');
      fetchOrders();
      fetchDatabase();
    } catch (error) {
      handleDbError(error, 'Failed to approve order.');
    }
  };

  // --- AUTH FLOW ---
  const login = async (email, password) => {
    if (!isSupabaseConfigured) throw new Error("Database not connected");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  // --- PRODUCT & CATEGORY CRUD ---
  const addProduct = async (productData, imageFile) => {
    try {
      let imageUrl = '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const newProduct = {
        name: productData.name,
        price: productData.price,
        description: productData.description,
        category_id: productData.categoryId,
        image: imageUrl
      };

      const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
      if (error) throw error;
      
      setProducts([data, ...products]);
      toast.success('Product added successfully!');
    } catch (error) {
      handleDbError(error, 'Failed to add product');
      throw error;
    }
  };

  const updateProduct = async (id, productData, imageFile) => {
    try {
      let imageUrl = productData.image; 

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const updates = {
        name: productData.name,
        price: productData.price,
        description: productData.description,
        category_id: productData.categoryId,
        image: imageUrl
      };

      const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
      if (error) throw error;

      setProducts(products.map(p => p.id === id ? data : p));
      toast.success('Product updated!');
    } catch (error) {
      handleDbError(error, 'Failed to update product');
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted.');
    } catch (error) {
      handleDbError(error, 'Failed to delete product');
    }
  };

  const addCategory = async (name) => {
    try {
      const { data, error } = await supabase.from('categories').insert([{ name }]).select().single();
      if (error) throw error;
      setCategories([...categories, data]);
      toast.success('Category created!');
    } catch (error) {
      handleDbError(error, 'Failed to create category');
    }
  };

  const deleteCategory = async (id) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted.');
    } catch (error) {
      handleDbError(error, 'Failed to delete category. Ensure no products are attached.');
    }
  };

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