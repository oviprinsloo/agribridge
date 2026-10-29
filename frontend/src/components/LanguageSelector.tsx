import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC<{ minimal?: boolean }> = ({ minimal = false }) => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  return (
    <div className="relative inline-flex items-center">
      <Globe className="w-4 h-4 text-emerald-700 mr-1.5 shrink-0" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="bg-white/90 border border-emerald-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm hover:border-emerald-400 transition"
        aria-label="Select Language"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} className="text-slate-800 font-medium py-1">
            {l.native} ({l.label})
          </option>
        ))}
      </select>
    </div>
  );
};
