import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured. Please check your .env file and RESTART your terminal/server.', { duration: 6000 });
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
      toast.error('Failed to load shop data.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    if (!isSupabaseConfigured) throw new Error("Database not connected");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

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
      toast.error(error.message);
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
      toast.error(error.message);
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
      toast.error(error.message);
    }
  };

  const addCategory = async (name) => {
    try {
      const { data, error } = await supabase.from('categories').insert([{ name }]).select().single();
      if (error) throw error;
      setCategories([...categories, data]);
      toast.success('Category created!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteCategory = async (id) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted.');
    } catch (error) {
      toast.error('Failed to delete category. Ensure no products are attached.');
    }
  };

  return (
    <ShopContext.Provider value={{
      products, categories, loading, user, login, logout,
      addProduct, updateProduct, deleteProduct, addCategory, deleteCategory
    }}>
      {children}
    </ShopContext.Provider>
  );
};