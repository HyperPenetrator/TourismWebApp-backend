'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import mockData from '@/lib/data.json';

export interface Artisan {
  id: string;
  name: string;
  category: string;
  location: string;
  bio: string;
  images: string[];
  isVerified: boolean;
  rating: number;
  experienceCount: number;
  type: 'artisan';
}

export interface Experience {
  id: string;
  artisanId: string;
  title: string;
  category: string;
  price: number;
  duration: string;
  images: string[];
  description: string;
  tags: string[];
  type: 'experience';
}

export type FeedItem = Artisan | Experience;

interface RecommendationEngineContextType {
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  recommendedItems: FeedItem[];
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
    const allItems: FeedItem[] = [
      ...mockData.artisans.map(a => ({ ...a, type: 'artisan' as const })),
      ...mockData.experiences.map(e => ({ ...e, type: 'experience' as const }))
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

export const useRecommendationEngine = () => {
  const context = useContext(RecommendationEngineContext);
  if (context === undefined) {
    throw new Error('useRecommendationEngine must be used within a RecommendationProvider');
  }
  return context;
};
