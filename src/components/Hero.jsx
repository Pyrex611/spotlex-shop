import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  const scrollToServices = (e) => {
    e.preventDefault();
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-28 pb-16 lg:pt-48 lg:pb-32 overflow-hidden flex items-center justify-center min-h-[85vh] md:min-h-[90vh]">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 md:w-96 md:h-96 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-72 h-72 md:w-96 md:h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <span className="text-brand-600 font-medium tracking-wider text-xs md:text-sm uppercase mb-3 md:mb-4 block">Elevated Living Spaces</span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-tight mb-5 md:mb-6">
            Experience the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-600">Purest Clean.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 mb-8 md:mb-10 max-w-2xl mx-auto font-light leading-relaxed px-4 md:px-0">
            Minimalist approach, maximum results. We provide premium cleaning services and sell industry-leading equipment for your home and office.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4 md:px-0">
            <a href="#services" onClick={scrollToServices} className="px-6 py-3.5 md:px-8 md:py-4 bg-gray-900 text-white rounded-full text-sm md:text-base font-medium hover:bg-gray-800 transition-all w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer shadow-md">
              Book a Service
            </a>
            <Link to="/shop" className="px-6 py-3.5 md:px-8 md:py-4 bg-white text-gray-900 border border-gray-200 shadow-sm rounded-full text-sm md:text-base font-medium hover:border-gray-300 hover:shadow-md transition-all w-full sm:w-auto flex items-center justify-center gap-2 group">
              Shop Equipment
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}