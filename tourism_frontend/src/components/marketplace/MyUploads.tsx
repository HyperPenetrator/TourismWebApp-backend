'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Tag, Clock, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

import { MarketplaceItem } from '@/lib/types';

export const MyUploads = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/marketplace/my-items`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error('[MyUploads] Failed to load items:', e);
        setLoading(false);
      });
  }, [token, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Package size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">Please login to view your uploads</p>
      </div>
    );
  }

  return (
    <div className="w-full relative px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">My Uploads</h2>
          <p className="text-sm text-slate-500 dark:text-white/60">
            {items.length} item{items.length !== 1 ? 's' : ''} listed
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-tactical-emerald/10 border border-tactical-emerald/20">
          <ShoppingBag size={14} className="text-tactical-emerald" />
          <span className="text-[11px] font-bold text-tactical-emerald uppercase tracking-wider">Seller</span>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="aspect-square bg-slate-200 dark:bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card overflow-hidden group hover:border-tactical-emerald/30 transition-all duration-300"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={
                      item.image_url?.startsWith('http')
                        ? item.image_url
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.image_url || ''}`
                    }
                    alt={item.title || 'Marketplace Item'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-3 left-3 flex gap-1 flex-wrap">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-black/40 backdrop-blur-md text-[10px] text-white rounded-md border border-white/10"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-slate-700 dark:text-white/90 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <span className="text-lg font-bold text-tactical-emerald ml-3 flex-shrink-0">
                      ₹{item.list_price}
                    </span>
                  </div>
                  {item.created_at && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase mt-2">
                      <Clock size={10} />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 dark:text-white/20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
              <Tag size={48} className="mb-4 opacity-10" />
              <p className="text-lg font-medium">No uploads yet</p>
              <p className="text-sm text-slate-400 dark:text-white/40">Go to the Marketplace and list your first item</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
