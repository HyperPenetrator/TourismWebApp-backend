'use client';

import React from 'react';
import { useRecommendation } from '@/context/RecommendationEngineContext';
import mockData from '@/lib/data.json';
import { Zap, TrendingUp, Tag, Globe } from 'lucide-react';

export const DynamicFilterStrip = () => {
  const { activeCategory, setActiveCategory } = useRecommendation();

  const getIcon = (id: string) => {
    switch (id) {
      case 'trending': return <Zap size={14} />;
      case 'budget': return <Tag size={14} />;
      case 'ethnic': return <Globe size={14} />;
      default: return <TrendingUp size={14} />;
    }
  };

  return (
    <div className="mt-4 mb-2 px-4 pb-4 overflow-x-auto no-scrollbar touch-pan-x max-w-screen-md mx-auto">
      <div className="flex gap-2 whitespace-nowrap">
        <button
          onClick={() => setActiveCategory(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
            activeCategory === null
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
          }`}
        >
          <Zap size={12} className={activeCategory === null ? 'text-white' : 'text-slate-400'} />
          Trending
        </button>

        {mockData.categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              activeCategory === cat.value
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
            }`}
          >
            <div className={activeCategory === cat.value ? 'text-white' : 'text-slate-400'}>
              {getIcon(cat.id)}
            </div>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
