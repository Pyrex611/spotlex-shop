import React from 'react';
import { Instagram, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <img src="/spotlex_logo.jpg" alt="Spotlex Logo" className="w-9 h-9 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
              <span className="text-xl font-semibold tracking-tight text-gray-900">Spotlex World</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs">
              Elevating spaces through minimalist design, premium equipment, and meticulous cleaning services.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Services</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Essential Clean</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Deep Revive</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Corporate Gleam</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Custom Plans</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Shop</h4>
            <ul className="space-y-3">
              <li><Link to="/shop" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Vacuums</Link></li>
              <li><Link to="/shop" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Eco Solutions</Link></li>
              <li><Link to="/shop" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Microfiber</Link></li>
              <li><Link to="/shop" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Hardware</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Spotlex Shop. All rights reserved.</p>
          <div className="flex gap-4">
             <span className="text-sm text-gray-400">Designed with precision.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}