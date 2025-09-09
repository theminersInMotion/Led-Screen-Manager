
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, helperText, ...props }) => {
  const id = React.useId();
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-brand-text-secondary mb-1">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full bg-brand-primary border border-gray-600 rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition"
      />
      {helperText && <p className="text-xs text-brand-text-secondary mt-1">{helperText}</p>}
    </div>
  );
};
