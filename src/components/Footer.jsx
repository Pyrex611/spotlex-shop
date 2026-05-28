import React from 'react';
import { Instagram, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Main Footer Flex/Grid Layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="w-full lg:w-1/3">
            <Link to="/" className="flex items-center gap-3 mb-6 group w-fit">
              <img src="/spotlex_logo.jpg" alt="Spotlex Logo" className="w-9 h-9 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
              <span className="text-xl font-semibold tracking-tight text-gray-900">Spotlex Shop</span>
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
          
          {/* Link Columns - Forced into 3 columns side-by-side on mobile */}
          <div className="w-full lg:w-2/3 grid grid-cols-3 gap-3 sm:gap-8">
            
            {/* Services */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Services</h4>
              <ul className="space-y-2 md:space-y-3">
                <li><a href="#" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Essential Clean</a></li>
                <li><a href="#" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Deep Revive</a></li>
                <li><a href="#" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Corporate Gleam</a></li>
                <li><a href="#" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Custom Plans</a></li>
              </ul>
            </div>

            {/* Shop */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Shop</h4>
              <ul className="space-y-2 md:space-y-3">
                <li><Link to="/shop" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Vacuums</Link></li>
                <li><Link to="/shop" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Eco Solutions</Link></li>
                <li><Link to="/shop" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Microfiber</Link></li>
                <li><Link to="/shop" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Hardware</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Company</h4>
              <ul className="space-y-2 md:space-y-3">
                <li><a href="#" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">About Us</a></li>
                <li><a href="#" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Careers</a></li>
                <li><a href="#" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Contact</a></li>
                <li><a href="#" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Privacy Policy</a></li>
                <li><a href="#" className="text-[11px] sm:text-xs md:text-sm text-gray-500 hover:text-brand-500 transition-colors leading-tight block">Terms</a></li>
              </ul>
            </div>

          </div>
        </div>
        
        {/* Copyright Bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs md:text-sm text-gray-400 text-center md:text-left">© {new Date().getFullYear()} Spotlex Shop. All rights reserved.</p>
          <div className="flex gap-4">
             <span className="text-xs md:text-sm text-gray-400">Designed with precision.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}