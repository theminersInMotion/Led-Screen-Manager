import React from 'react';

interface ResultCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ icon, label, value, subValue }) => {
  return (
    <div className="bg-brand-secondary p-4 rounded-lg shadow-lg flex items-start gap-4 transition-transform hover:scale-105 result-card-print">
      <div className="flex-shrink-0 text-brand-accent bg-brand-accent/10 p-3 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm text-brand-text-secondary">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-brand-text-primary tracking-tight">{value}</p>
        {subValue && <p className="text-xs text-brand-text-secondary mt-1">{subValue}</p>}
      </div>
    </div>
  );
};