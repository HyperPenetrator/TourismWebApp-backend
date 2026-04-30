import React from 'react';
import { useMarketplaceWebsocket } from '@/hooks/useMarketplaceWebsocket';
import { Tag } from 'lucide-react';

export const LiveMarketplaceFeed: React.FC = () => {
  // Use the local backend websocket URL
  const { items, isConnected } = useMarketplaceWebsocket('ws://localhost:8002/ws/marketplace');

  return (
    <div className="w-full space-y-6">
      {/* Feed Header & Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">
          Live Marketplace Feed
        </h2>
        <div className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 border border-white/5">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-medium text-white/70">
            {isConnected ? 'LIVE' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Grid of Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
          <div className="mb-4 h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-lg font-medium text-white">Listening for new artisan uploads...</p>
          <p className="mt-1 text-sm text-white/50">New items will appear here instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div 
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] animate-in fade-in slide-in-from-top-8 duration-500 fill-mode-forwards"
            >
              {/* Image Container */}
              <div className="relative aspect-square w-full overflow-hidden bg-black/40">
                {/* Fallback pattern in case image fails or takes time to load */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <img 
                  src={`http://localhost:8002${item.image_url}`} 
                  alt={item.description}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback if the image doesn't exist locally
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                
                {/* Price Tag */}
                <div className="absolute top-4 right-4 rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 font-mono font-bold text-emerald-400">
                  ${Number(item.price).toFixed(2)}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm font-medium text-white/90 line-clamp-2 mb-4">
                  {item.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, idx) => (
                    <span 
                      key={`${item.id}-tag-${idx}`}
                      className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white/70"
                    >
                      <Tag className="h-3 w-3 opacity-50" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
