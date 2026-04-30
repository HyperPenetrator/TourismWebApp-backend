'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface HeaderSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export const HeaderSearch = ({ query, onQueryChange }: HeaderSearchProps) => {
  return (
    <div className="pt-4 pb-4">
      <div className="relative group w-full">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400 group-focus-within:text-tactical-emerald transition-colors" />
        </div>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search Discovery..."
          className="w-full bg-[#F1F5F9]/50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-[15px] focus:outline-none focus:bg-white focus:border-tactical-emerald/30 transition-all placeholder:text-slate-400 text-slate-900"
        />
      </div>
    </div>
  );
};
