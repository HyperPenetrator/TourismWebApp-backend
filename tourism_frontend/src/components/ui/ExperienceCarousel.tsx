'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ExperienceCarouselProps {
  images: string[];
  aspectRatio?: 'aspect-square' | 'aspect-video' | 'aspect-[4/3]';
}

export const ExperienceCarousel = ({ 
  images, 
  aspectRatio = 'aspect-[4/3]' 
}: ExperienceCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      const scrollLeft = scrollRef.current.scrollLeft;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }
  };

  return (
    <div className="relative group">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth rounded-xl border border-black/[0.05] bg-slate-50 ${aspectRatio}`}
      >
        {images.map((image, idx) => (
          <div 
            key={`${image}-${idx}`}
            className="flex-none w-full h-full snap-center"
          >
            <img 
              src={image} 
              alt={`Slide ${idx + 1}`} 
              className="w-full h-full object-cover" 
            />
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-3 right-3 flex gap-1 px-2 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm transition-opacity duration-300">
          {images.map((_, idx) => (
            <div 
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === idx 
                  ? 'bg-[#10B981] scale-110 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                  : 'bg-black/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
