'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Share2, Tag as TagIcon, Check } from 'lucide-react';

interface MarketplaceItem {
  id: string;
  image_url: string;
  description: string;
  list_price: number;
  tags: string[];
  timestamp: string;
}

export const MarketplaceFeed = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [securedItems, setSecuredItems] = useState<Set<string>>(new Set());

  const handleSecure = (id: string) => {
    setSecuredItems(prev => new Set(prev).add(id));
  };

  useEffect(() => {
    // Establish WebSocket connection
    const socket = new WebSocket('ws://localhost:8001/ws/feed');

    socket.onopen = () => {
      console.log('Connected to Marketplace Live Feed');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const newItem: MarketplaceItem = JSON.parse(event.data);
      // Prepend new item to the top of the feed
      setItems(prevItems => [newItem, ...prevItems]);
    };

    socket.onclose = () => {
      console.log('Disconnected from Marketplace Live Feed');
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Live Marketplace</h2>
          <p className="text-sm text-slate-500 dark:text-white/60">Real-time heritage commerce feed</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-tactical-emerald animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-white/40">
            {isConnected ? 'Sync Active' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const isSecured = securedItems.has(item.id);
            
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  layout: { duration: 0.3 }
                }}
                className="glass-card overflow-hidden group"
              >
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={item.image_url} 
                    alt="Marketplace Item" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Actions Overlay */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-tactical-emerald transition-colors">
                      <Heart size={18} />
                    </button>
                    <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-tactical-emerald transition-colors">
                      <Share2 size={18} />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 flex gap-1">
                    {item.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-black/40 backdrop-blur-md text-[10px] text-white rounded-md border border-white/10">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-slate-700 dark:text-white/90 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <span className="text-lg font-bold text-tactical-emerald">
                      ₹{item.list_price}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => handleSecure(item.id)}
                    disabled={isSecured}
                    className={`w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border ${
                      isSecured 
                        ? 'bg-tactical-emerald/20 border-tactical-emerald text-tactical-emerald cursor-default'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-tactical-emerald/50 hover:bg-tactical-emerald/10 text-slate-900 dark:text-white'
                    }`}
                  >
                    {isSecured ? <Check size={16} /> : <ShoppingCart size={16} />}
                    {isSecured ? 'Ordered to the Author' : 'Secure Item'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 dark:text-white/20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
            <TagIcon size={48} className="mb-4 opacity-10" />
            <p className="text-lg font-medium">Waiting for live uploads...</p>
            <p className="text-sm text-slate-400 dark:text-white/40">Be the first to list a heritage treasure</p>
          </div>
        )}
      </div>
    </div>
  );
};
