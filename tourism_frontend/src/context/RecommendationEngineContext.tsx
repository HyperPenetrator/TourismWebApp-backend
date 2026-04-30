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
  deployInterest: (item: FeedItem) => Promise<void>;
  archiveTarget: (item: FeedItem) => Promise<void>;
}

const RecommendationEngineContext = createContext<RecommendationEngineContextType | undefined>(undefined);

export const RecommendationProvider = ({ children }: { children: ReactNode }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [archivedItems, setArchivedItems] = useState<string[]>([]);
  const [weightMap, setWeightMap] = useState<Record<string, number>>({
    'Eco-Tours': 0,
    'Authentic Handloom': 0,
    'Local Stalls': 0
  });

  const deployInterest = async (item: FeedItem) => {
    console.log(`[MCP] deploy_interest called for ${item.id} (${item.type})`);
    // Boost affinity for this category
    setWeightMap(prev => ({
      ...prev,
      [item.category]: (prev[item.category] || 0) + 2
    }));
    
    // In a real app, this would be:
    // await mcp.callTool('deploy_interest', { user_id: 'u1', target_id: item.id, category: item.category });
  };

  const archiveTarget = async (item: FeedItem) => {
    console.log(`[MCP] archive_target called for ${item.id}`);
    setArchivedItems(prev => [...prev, item.id]);
    
    // In a real app, this would be:
    // await mcp.callTool('archive_target', { user_id: 'u1', target_id: item.id });
  };

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

    return allItems
      .filter(item => !archivedItems.includes(item.id))
      .sort((a, b) => {
        const weightA = weightMap[a.category] || 0;
        const weightB = weightMap[b.category] || 0;
        
        // If categories match active category, they get a boost
        const activeBoostA = a.category === activeCategory ? 10 : 0;
        const activeBoostB = b.category === activeCategory ? 10 : 0;

        return (weightB + activeBoostB) - (weightA + activeBoostA);
      });
  }, [activeCategory, weightMap, archivedItems]);

  return (
    <RecommendationEngineContext.Provider 
      value={{ 
        activeCategory, 
        setActiveCategory: handleSetCategory, 
        recommendedItems,
        weightMap,
        deployInterest,
        archiveTarget
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
