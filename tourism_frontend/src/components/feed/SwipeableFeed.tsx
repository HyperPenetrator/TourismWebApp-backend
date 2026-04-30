'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ArtisanProfileCard } from './ArtisanProfileCard';
import { ExperienceCard } from './ExperienceCard';
import { FeedItem, Artisan, Experience } from '@/context/RecommendationEngineContext';
import { ShieldCheck, Archive, Zap } from 'lucide-react';

interface SwipeableFeedProps {
  items: FeedItem[];
  onDeploy: (item: FeedItem) => void;
  onArchive: (item: FeedItem) => void;
}

export const SwipeableFeed: React.FC<SwipeableFeedProps> = ({ items, onDeploy, onArchive }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queue, setQueue] = useState<{ type: 'deploy' | 'archive', item: FeedItem }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Background Worker: Processes the swipe actions one by one to avoid backend overload
  useEffect(() => {
    if (queue.length > 0 && !isProcessing) {
      const processNext = async () => {
        setIsProcessing(true);
        const action = queue[0];
        
        try {
          if (action.type === 'deploy') {
            await onDeploy(action.item);
          } else {
            await onArchive(action.item);
          }
          console.log(`[Queue] Processed ${action.type} for ${action.item.id}`);
        } catch (error) {
          console.error(`[Queue] Failed to process ${action.type}:`, error);
        } finally {
          setQueue(prev => prev.slice(1));
          setIsProcessing(false);
        }
      };
      
      processNext();
    }
  }, [queue, isProcessing, onDeploy, onArchive]);

  // We only show the top 2 cards to keep the DOM light and animations smooth
  const currentItem = items[currentIndex];
  const nextItem = items[currentIndex + 1];

  const handleSwipe = (direction: 'left' | 'right') => {
    const actionType = direction === 'right' ? 'deploy' : 'archive';
    
    // Optimistic Update: Add to background queue and move to next card instantly
    setQueue(prev => [...prev, { type: actionType, item: currentItem }]);
    setCurrentIndex((prev) => prev + 1);
  };

  if (!currentItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4">
          <div className="w-8 h-8 rounded-full bg-tactical-emerald/10 animate-pulse"></div>
        </div>
        <p className="text-sm font-mono uppercase tracking-widest">Protocol Stream Depleted</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[550px] perspective-1000">
      <AnimatePresence mode="popLayout">
        {/* Current Card (Interactive) */}
        <SwipeCard
          key={currentItem.id}
          item={currentItem}
          onSwipe={handleSwipe}
        />
      </AnimatePresence>
    </div>
  );
};

interface SwipeCardProps {
  item: FeedItem;
  onSwipe: (direction: 'left' | 'right') => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ item, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  // Tactical Overlays
  const deployOpacity = useTransform(x, [50, 150], [0, 1]);
  const archiveOpacity = useTransform(x, [-150, -50], [1, 0]);

  const springConfig = { damping: 25, stiffness: 300 };
  const xSpring = useSpring(x, springConfig);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{ x: xSpring, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ 
        x: x.get() > 0 ? 500 : -500, 
        opacity: 0, 
        scale: 0.5,
        transition: { duration: 0.3 } 
      }}
    >
      {/* Deploy Overlay */}
      <motion.div 
        style={{ opacity: deployOpacity }}
        className="absolute inset-0 z-20 pointer-events-none rounded-3xl border-4 border-tactical-emerald bg-tactical-emerald/10 flex items-center justify-center"
      >
        <div className="bg-tactical-emerald text-white px-6 py-3 rounded-full font-black uppercase tracking-[0.4em] flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
          <Zap size={20} className="animate-pulse" />
          Deploy Interest
        </div>
      </motion.div>

      {/* Archive Overlay */}
      <motion.div 
        style={{ opacity: archiveOpacity }}
        className="absolute inset-0 z-20 pointer-events-none rounded-3xl border-4 border-red-500 bg-red-500/10 flex items-center justify-center"
      >
        <div className="bg-red-500 text-white px-6 py-3 rounded-full font-black uppercase tracking-[0.4em] flex items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
          <Archive size={20} />
          Archive Target
        </div>
      </motion.div>

      {/* The Actual Card */}
      <div className="h-full pointer-events-none select-none">
        {item.type === 'artisan' ? (
          <ArtisanProfileCard artisan={item as Artisan} />
        ) : (
          <ExperienceCard experience={item as Experience} />
        )}
      </div>
    </motion.div>
  );
};
