import React from 'react';
import { Construction } from 'lucide-react';

export const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="p-8 flex items-center justify-center min-h-screen" data-testid="placeholder-page">
      <div className="text-center">
        <Construction size={64} className="mx-auto text-slate-300 mb-4" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {title}
        </h1>
        <p className="text-slate-600">{description}</p>
      </div>
    </div>
  );
};
