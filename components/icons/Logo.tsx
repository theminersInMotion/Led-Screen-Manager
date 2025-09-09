
import React from 'react';

export const Logo: React.FC = () => (
  <div className="w-12 h-12 bg-brand-secondary rounded-lg flex items-center justify-center shadow-lg">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="6" height="6" x="4" y="4" fill="#00bfff" rx="1"/>
      <rect width="6" height="6" x="14" y="4" fill="#00bfff" opacity="0.6" rx="1"/>
      <rect width="6" height="6" x="4" y="14" fill="#00bfff" opacity="0.6" rx="1"/>
      <rect width="6" height="6" x="14" y="14" fill="#00bfff" rx="1"/>
    </svg>
  </div>
);
