'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
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
  engagement?: {
    likes: number;
    comments: number;
    reshares: number;
  };
}

export type FeedItem = Artisan | Experience;
export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface RecommendationEngineContextType {
  // Recommendation Logic
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  recommendedItems: FeedItem[];
  weightMap: Record<string, number>;
  
  // Swipe Gesture States
  dragX: number;
  dragY: number;
  swipeDirection: SwipeDirection;
  
  // Actions
  setDragX: (x: number) => void;
  setDragY: (y: number) => void;
  setSwipeDirection: (direction: SwipeDirection) => void;
  handleSwipe: (direction: SwipeDirection) => Promise<void>;
  
  // Engine Status
  isLoading: boolean;
  error: string | null;
}

const RecommendationEngineContext = createContext<RecommendationEngineContextType | undefined>(undefined);

export const RecommendationProvider = ({ children }: { children: ReactNode }) => {
  // Recommendation States
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [weightMap, setWeightMap] = useState<Record<string, number>>({
    'Eco-Tours': 0,
    'Authentic Handloom': 0,
    'Local Stalls': 0
  });

  // Gesture States
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  
  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category selection handler
  const handleSetCategory = useCallback((category: string | null) => {
    setActiveCategory(category);
    if (category) {
      setWeightMap(prev => ({
        ...prev,
        [category]: prev[category] + 1
      }));
    }
  }, []);

  // Swipe logic (Interfacing with backend API eventually)
  const handleSwipe = useCallback(async (direction: SwipeDirection) => {
    if (!direction) return;

    try {
      setIsLoading(true);
      // In production, this would call our backend API to update weights/preferences
      // await fetch('/api/recommendations/swipe', { method: 'POST', body: JSON.stringify({ direction }) });
      
      console.log(`Backend Interface: Recorded swipe ${direction}`);
      
      // Reset gesture states after swipe
      setDragX(0);
      setDragY(0);
      setSwipeDirection(null);
    } catch (err) {
      setError('Failed to process swipe');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Engine: Sort items based on weights and active category
  const recommendedItems = useMemo(() => {
    const allItems: FeedItem[] = [
      ...mockData.artisans.map(a => ({ ...a, type: 'artisan' as const })),
      ...mockData.experiences.map(e => ({ ...e, type: 'experience' as const }))
    ];

    return [...allItems].sort((a, b) => {
      const weightA = weightMap[a.category] || 0;
      const weightB = weightMap[b.category] || 0;
      
      const activeBoostA = a.category === activeCategory ? 20 : 0;
      const activeBoostB = b.category === activeCategory ? 20 : 0;

      const verifiedBoostA = a.type === 'artisan' && (a as Artisan).isVerified ? 50 : 0;
      const verifiedBoostB = b.type === 'artisan' && (b as Artisan).isVerified ? 50 : 0;

      return (weightB + activeBoostB + verifiedBoostB) - (weightA + activeBoostA + verifiedBoostA);
    });
  }, [activeCategory, weightMap]);

  const value = useMemo(() => ({
    activeCategory,
    setActiveCategory: handleSetCategory,
    recommendedItems,
    weightMap,
    dragX,
    dragY,
    swipeDirection,
    setDragX,
    setDragY,
    setSwipeDirection,
    handleSwipe,
    isLoading,
    error
  }), [activeCategory, handleSetCategory, recommendedItems, weightMap, dragX, dragY, swipeDirection, handleSwipe, isLoading, error]);

  return (
    <RecommendationEngineContext.Provider value={value}>
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
