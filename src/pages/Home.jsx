import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';

export default function Home() {
  return (
    <div className="w-full">
      <Hero />
      <Services />
    </div>
  );
}