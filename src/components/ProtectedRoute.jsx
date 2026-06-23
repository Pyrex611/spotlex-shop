import React from 'react';
import { Navigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, authLoading } = useShop();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  // Not logged in -> Go to Login
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Logged in, but NOT an admin -> Kick to storefront
  if (!isAdmin) {
    toast.error("Unauthorized: Strict Admin access required.");
    return <Navigate to="/" replace />;
  }

  // Verified Admin -> Allow Access
  return children;
}