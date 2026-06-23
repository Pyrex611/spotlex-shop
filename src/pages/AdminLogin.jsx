import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { motion } from 'framer-motion';
import { Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isAdmin, authLoading } = useShop();
  const navigate = useNavigate();

  // If auth is still loading, wait before evaluating redirects
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>;
  }

  // Redirect based on role if already logged in
  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else {
      toast.error("Unauthorized account.");
      return <Navigate to="/" replace />;
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Authenticating...');
      // The auth state listener in ShopContext will catch this, check the role, and trigger a re-render.
    } catch (error) {
      toast.error('Invalid credentials. Please try again.');
      setIsSubmitting(false);
    } 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Secure Access</h2>
          <p className="text-gray-500 mt-2">Sign in to the Spotlex Administration panel.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" placeholder="admin@spotlex.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" placeholder="••••••••" />
          </div>
          <button disabled={isSubmitting} type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-brand-600 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 mt-2">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}