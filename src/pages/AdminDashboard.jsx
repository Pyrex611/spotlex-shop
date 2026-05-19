import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Home, Package, Tags, Plus, Pencil, Trash2, ImagePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory } = useShop();
  
  const [activeTab, setActiveTab] = useState('products');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // Product Form State
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', description: '', categoryId: '', image: '' });
  const fileInputRef = useRef(null);

  // Category Form State
  const [categoryName, setCategoryName] = useState('');

  // Handle Image Upload -> Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ ...product });
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', price: '', description: '', categoryId: categories[0]?.id || '', image: '' });
    }
    setIsProductModalOpen(true);
  };

  const saveProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct({ ...productForm, price: Number(productForm.price) });
    } else {
      addProduct({ ...productForm, price: Number(productForm.price) });
    }
    setIsProductModalOpen(false);
  };

  const saveCategory = (e) => {
    e.preventDefault();
    if (categoryName.trim()) {
      addCategory(categoryName);
      setCategoryName('');
      setIsCategoryModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 shrink-0">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3">
          <img src="/spotlex_logo.jpg" alt="Logo" className="w-8 h-8 rounded-full" />
          <span className="font-bold text-gray-900 text-lg">Spotlex Admin</span>
        </div>
        <nav className="p-4 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            <Home className="w-5 h-5" /> Back to Store
          </Link>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Package className="w-5 h-5" /> Manage Products
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'categories' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Tags className="w-5 h-5" /> Manage Categories
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Products Inventory</h1>
                <p className="text-gray-500 text-sm">Add, update, or remove equipment from the shop.</p>
              </div>
              <button onClick={() => openProductModal()} className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {categories.find(c => c.id === product.categoryId)?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">₦{Number(product.price).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openProductModal(product)} className="text-brand-600 hover:bg-brand-50 p-2 rounded-md transition-colors mr-2">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'categories' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                <p className="text-gray-500 text-sm">Manage product categorization.</p>
              </div>
              <button onClick={() => setIsCategoryModalOpen(true)} className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm">
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Category Name</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map(category => (
                    <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => deleteCategory(category.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={saveProduct} className="space-y-4">
                {/* Image Upload Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl h-40 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-brand-500 transition-colors overflow-hidden relative"
                  >
                    {productForm.image ? (
                      <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <ImagePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-500">Click to upload image</span>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                    <input required type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select required value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white">
                      <option value="" disabled>Select category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea required rows="3" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"></textarea>
                </div>

                <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors mt-6">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Category</h2>
                <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={saveCategory}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input required type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="e.g. Cleansers" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
                </div>
                <button type="submit" className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                  Save Category
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}