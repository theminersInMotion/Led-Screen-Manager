
import React from 'react';

export const PlayerIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
    <path d="M7 15v-6l5 3l-5 3z"></path>
    <line x1="15" y1="12" x2="17" y2="12"></line>
  </svg>
);
