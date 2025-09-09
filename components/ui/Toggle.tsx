
import React from 'react';

interface ToggleOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface ToggleProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export const Toggle = <T extends string>({ options, value, onChange }: ToggleProps<T>) => {
  return (
    <div className="flex items-center bg-brand-primary rounded-lg p-1 border border-gray-600">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-primary ${
            value === option.value
              ? 'bg-brand-accent text-brand-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
