'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useMarketplaceFeedSSE, MarketplaceItem } from '@/hooks/useMarketplaceFeedSSE';
import { IndianRupee, Tag, Clock } from 'lucide-react';

interface LiveMarketplaceFeedProps {
  initialItems?: MarketplaceItem[];
  wsUrl?: string;
}

const DUMMY_ITEMS: MarketplaceItem[] = [
  {
    id: 'm1',
    title: 'Vintage Muga Silk Saree',
    description: 'Authentic handwoven Muga silk from Assam. Known for its extreme durability and yellowish-golden tint.',
    price: 15000,
    tags: ['Silk', 'Assam', 'Handloom'],
    imageUrl: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=1000',
    artisanId: 'a1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'm2',
    title: 'Bamboo Craft Storage Basket',
    description: 'Intricately woven bamboo basket, perfect for eco-friendly storage.',
    price: 1200,
    tags: ['Bamboo', 'Sikkim', 'Eco-friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=1000',
    artisanId: 'a2',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export const LiveMarketplaceFeed: React.FC<LiveMarketplaceFeedProps> = ({ 
  initialItems = DUMMY_ITEMS, 
  sseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/sse/marketplace` 
) => {
  const [items, setItems] = useState<MarketplaceItem[]>(initialItems);
  const { newItem, isConnected, mockPushItem } = useMarketplaceFeedSSE(sseUrl);

  // When a new item arrives via WS, animate it into the top of the grid
  useEffect(() => {
    if (newItem) {
      setItems((prev) => {
        // Prevent duplicates if backend sends same item twice
        if (prev.some((item) => item.id === newItem.id)) return prev;
        return [newItem, ...prev];
      });
    }
  }, [newItem]);

  // A helper function for demonstration (so the user can see it work without a real backend)
  const simulateLiveUpload = () => {
    const mockItem: MarketplaceItem = {
      id: `m-${Math.random().toString(36).substring(7)}`,
      title: 'Hand-carved Wooden Mask',
      description: 'Traditional Majuli mask used in Bhaona performances.',
      price: 3500 + Math.floor(Math.random() * 1000),
      tags: ['Woodwork', 'Majuli', 'Cultural'],
      imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000',
      artisanId: 'a3',
      createdAt: new Date().toISOString(),
    };
    mockPushItem(mockItem);
  };

  return (
    <div className="w-full">
      {/* Header & Status */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light text-white tracking-wide">Live Feed</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
            <span className="text-xs uppercase tracking-widest text-white/50">
              {isConnected ? 'Neural Link Active' : 'Connecting to Node...'}
            </span>
          </div>
        </div>
        
        {/* Development Helper - Can be removed in production */}
        <button 
          onClick={simulateLiveUpload}
          className="text-xs border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full hover:bg-emerald-500/10 transition-colors backdrop-blur-md"
        >
          Simulate Incoming
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#0F172A]/40 border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/50">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105 group-hover:opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-80" />
                
                {/* Price Tag */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md border border-white/10">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-sm font-medium text-white font-mono">{item.price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5">
                <h3 className="text-lg font-medium text-white line-clamp-1">{item.title}</h3>
                <p className="mt-2 text-sm text-white/50 line-clamp-2 flex-1">{item.description}</p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/70 border border-white/5"
                    >
                      <Tag className="h-3 w-3 text-white/30" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center overflow-hidden">
                       <Image 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.artisanId}`} 
                          alt="Artisan" 
                          width={24} 
                          height={24} 
                        />
                    </div>
                    <span className="text-xs text-white/60 font-mono tracking-tight">{item.artisanId.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/40">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px] font-mono tracking-wider">JUST NOW</span>
                  </div>
                </div>
              </div>
              
              {/* Tactical Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20 rounded-tr-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
