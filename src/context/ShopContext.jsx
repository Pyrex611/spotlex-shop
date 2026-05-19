import React, { createContext, useState, useEffect, useContext } from 'react';
import { products as initialProducts, categories as initialCategories } from '../data';

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Load from localStorage or use initial data
  useEffect(() => {
    const storedProducts = localStorage.getItem('spotlex_products');
    const storedCategories = localStorage.getItem('spotlex_categories');

    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts(initialProducts);
      localStorage.setItem('spotlex_products', JSON.stringify(initialProducts));
    }

    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      setCategories(initialCategories);
      localStorage.setItem('spotlex_categories', JSON.stringify(initialCategories));
    }
  }, []);

  // Save Products to LocalStorage on change
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('spotlex_products', JSON.stringify(products));
    }
  }, [products]);

  // Save Categories to LocalStorage on change
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('spotlex_categories', JSON.stringify(categories));
    }
  }, [categories]);

  // Product Actions
  const addProduct = (product) => {
    setProducts([...products, { ...product, id: Date.now() }]);
  };

  const updateProduct = (updatedProduct) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Category Actions
  const addCategory = (categoryName) => {
    const newCategory = { id: `cat-${Date.now()}`, name: categoryName };
    setCategories([...categories, newCategory]);
  };

  const deleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id));
    // Optional: Move products of deleted category to 'Uncategorized'
  };

  return (
    <ShopContext.Provider value={{
      products, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory
    }}>
      {children}
    </ShopContext.Provider>
  );
};