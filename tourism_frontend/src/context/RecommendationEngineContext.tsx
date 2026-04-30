'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import mockData from '@/lib/data.json';

interface RecommendationEngineContextType {
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  recommendedItems: any[];
  weightMap: Record<string, number>;
}

const RecommendationEngineContext = createContext<RecommendationEngineContextType | undefined>(undefined);

export const RecommendationProvider = ({ children }: { children: ReactNode }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [weightMap, setWeightMap] = useState<Record<string, number>>({
    'Eco-Tours': 0,
    'Authentic Handloom': 0,
    'Local Stalls': 0
  });

  const handleSetCategory = (category: string | null) => {
    setActiveCategory(category);
    if (category) {
      setWeightMap(prev => ({
        ...prev,
        [category]: prev[category] + 1
      }));
    }
  };

  const recommendedItems = useMemo(() => {
    const allItems = [
      ...mockData.artisans.map(a => ({ ...a, type: 'artisan' })),
      ...mockData.experiences.map(e => ({ ...e, type: 'experience' }))
    ];

    return [...allItems].sort((a, b) => {
      const weightA = weightMap[a.category] || 0;
      const weightB = weightMap[b.category] || 0;
      
      // If categories match active category, they get a boost
      const activeBoostA = a.category === activeCategory ? 10 : 0;
      const activeBoostB = b.category === activeCategory ? 10 : 0;

      return (weightB + activeBoostB) - (weightA + activeBoostA);
    });
  }, [activeCategory, weightMap]);

  return (
    <RecommendationEngineContext.Provider 
      value={{ 
        activeCategory, 
        setActiveCategory: handleSetCategory, 
        recommendedItems,
        weightMap 
      }}
    >
      {children}
    </RecommendationEngineContext.Provider>
  );
};

export const useRecommendation = () => {
  const context = useContext(RecommendationEngineContext);
  if (context === undefined) {
    throw new Error('useRecommendation must be used within a RecommendationProvider');
  }
  return context;
};
