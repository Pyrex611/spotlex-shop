// src/context/ShopContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

const ShopContext = createContext();
export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [user,        setUser]        = useState(null);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const handleDbError = (error, fallbackMessage) => {
    console.error(error);
    if (error.message?.includes('row-level security') || error.code === '42501') {
      toast.error('Permission Denied: Database security policies are blocking this action.');
    } else if (error.message) {
      toast.error(`Database Error: ${error.message}`);
    } else {
      toast.error(fallbackMessage);
    }
  };

  const checkRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data && (data.role === 'admin' || data.role === 'superadmin')) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── Auth bootstrapping ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured.');
      setLoading(false);
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRole(session.user.id);
      } else {
        setIsAdmin(false);
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRole(session.user.id);
      } else {
        setIsAdmin(false);
        setAuthLoading(false);
      }
    });

    fetchDatabase();
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAdmin) fetchOrders();
  }, [user, isAdmin]);

  // ─── Data fetching ───────────────────────────────────────────────────────────

  const fetchDatabase = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
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
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to load orders', error);
    }
  };

  // ─── Order management ────────────────────────────────────────────────────────

  /**
   * Creates a pending order row. The `cartItems` array comes from the cart
   * and already includes all product fields (including zoho_item_id) because
   * products are fetched with select('*') from Supabase.
   */
  const createOrder = async (cartItems, subtotal, method = 'whatsapp', reference = null) => {
    try {
      const orderRef = reference || `WA-${Date.now()}`;
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          reference:      orderRef,
          items:          cartItems,   // includes zoho_item_id on Zoho-synced products
          subtotal:       subtotal,
          payment_method: method,
          status:         'pending',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDbError(error, 'Failed to initialize order.');
      throw error;
    }
  };

  /**
   * Admin action: approve a WhatsApp / cash payment.
   *
   * Calls the `zoho-approve-order` Edge Function which:
   *   • Marks the order as paid in Supabase
   *   • Deducts stock in Supabase
   *   • Creates a Zoho Inventory invoice (best-effort)
   *
   * We no longer do stock deduction here — the Edge Function handles it
   * so that the Zoho invoice and the local stock change are one atomic step.
   */
  const approveOrder = async (orderId, _orderItems) => {
    const toastId = toast.loading('Confirming payment & syncing to Zoho...');
    try {
      const { data, error } = await supabase.functions.invoke('zoho-approve-order', {
        body: { orderId },
      });

      if (error) throw new Error(error.message || 'Edge Function call failed.');
      if (data?.success === false) throw new Error(data.error || 'Unknown error from Edge Function.');

      // Surface whether the Zoho invoice was created, skipped, or errored
      if (data?.zoho?.error) {
        toast.success('Payment confirmed & stock deducted!', { id: toastId });
        toast.error(`Zoho invoice warning: ${data.zoho.error}`, { duration: 6000 });
      } else if (data?.zoho?.skipped) {
        toast.success('Payment confirmed & stock deducted! (Zoho invoice skipped — no Zoho item IDs on order)', { id: toastId });
      } else {
        toast.success(
          `Payment confirmed! Zoho Invoice #${data?.zoho?.invoice_number ?? ''} created.`,
          { id: toastId }
        );
      }

      fetchOrders();
      fetchDatabase();
    } catch (error) {
      toast.error(`Approval failed: ${error.message}`, { id: toastId });
    }
  };

  // ─── Auth ────────────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Database not connected');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  // ─── Product CRUD ────────────────────────────────────────────────────────────

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

      const { data, error } = await supabase
        .from('products')
        .insert([{
          name:        productData.name,
          price:       productData.price,
          description: productData.description,
          category_id: productData.categoryId,
          image:       imageUrl,
          // zoho_item_id intentionally omitted — manually-added products don't have one
        }])
        .select()
        .single();

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

      const { data, error } = await supabase
        .from('products')
        .update({
          name:        productData.name,
          price:       productData.price,
          description: productData.description,
          category_id: productData.categoryId,
          image:       imageUrl,
        })
        .eq('id', id)
        .select()
        .single();

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

  // ─── Category CRUD ───────────────────────────────────────────────────────────

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
      handleDbError(error, 'Failed to delete category. Ensure no products are still using it.');
    }
  };

  // ─── Context value ───────────────────────────────────────────────────────────

  return (
    <ShopContext.Provider value={{
      products, categories, orders, loading, authLoading,
      user, isAdmin,
      login, logout,
      addProduct, updateProduct, deleteProduct,
      addCategory, deleteCategory,
      createOrder, approveOrder,
      fetchOrders, fetchDatabase,
    }}>
      {children}
    </ShopContext.Provider>
  );
};