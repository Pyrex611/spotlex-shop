import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Droplets, Home, Briefcase } from 'lucide-react';
import { services } from '../data';

const iconMap = {
  Sparkles: <Sparkles className="w-6 h-6 text-brand-500" />,
  Droplets: <Droplets className="w-6 h-6 text-brand-500" />,
  Home: <Home className="w-6 h-6 text-brand-500" />,
  Briefcase: <Briefcase className="w-6 h-6 text-brand-500" />
};

export default function Services() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section id="services" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12 md:mb-16 md:text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3 md:mb-4">Our Services</h2>
          <p className="text-gray-500 text-base md:text-lg">Meticulous attention to detail tailored to your lifestyle.</p>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {services.map((service) => (
            <motion.div 
              key={service.id} 
              variants={itemVariants}
              className="group p-6 md:p-8 rounded-2xl md:rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                {iconMap[service.icon]}
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{service.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5 md:mb-6 md:h-20">
                {service.description}
              </p>
              <div className="text-sm font-semibold text-brand-600 border-t border-gray-200 pt-4">
                {service.price}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}