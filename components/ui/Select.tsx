
import React from 'react';
import type { SelectOption } from '../../types';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({ label, options, ...props }) => {
  const id = React.useId();
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-brand-text-secondary mb-1">
        {label}
      </label>
      <select
        id={id}
        {...props}
        className="w-full bg-brand-primary border border-gray-600 rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
