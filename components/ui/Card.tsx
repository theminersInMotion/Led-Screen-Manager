
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg p-6 h-full">
      <h2 className="text-xl font-bold mb-4 text-brand-accent">{title}</h2>
      {children}
    </div>
  );
};
