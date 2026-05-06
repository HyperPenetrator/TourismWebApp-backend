import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketplaceItem } from '@/lib/types';
export type { MarketplaceItem };

export const useMarketplaceFeedSSE = (url: string) => {
  const [newItem, setNewItem] = useState<MarketplaceItem | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
        eventSourceRef.current.close();
    }

    console.log('[SSE] Connecting to Marketplace feed...');
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('[SSE] Marketplace feed connected');
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle both raw items and wrapped event payloads
        const rawItem = data.event === 'new_item' ? data.data : data;
        const normalizedItem: MarketplaceItem = {
          ...rawItem,
          imageUrl: rawItem.imageUrl || rawItem.image_url,
          artisanId: rawItem.artisanId || String(rawItem.seller_id || 'anonymous'),
          createdAt: rawItem.createdAt || (rawItem.timestamp ? new Date(rawItem.timestamp).toISOString() : new Date().toISOString())
        };
        setNewItem(normalizedItem);
      } catch (err) {
        console.error('[SSE] Error parsing marketplace item:', err);
      }
    };

    es.onerror = (err) => {
      console.error('[SSE] Marketplace feed error:', err);
      setIsConnected(false);
      es.close();
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  const mockPushItem = (item?: MarketplaceItem) => {
    if (item) {
      setNewItem(item);
      return;
    }
    const mockItem: MarketplaceItem = {
      id: `mock_${Math.floor(Math.random() * 1000)}`,
      title: 'Mock Artisan Product',
      image_url: `https://picsum.photos/seed/${Math.random()}/400/400`,
      imageUrl: `https://picsum.photos/seed/${Math.random()}/400/400`,
      description: 'Mock Artisan Product (Client-Side Push)',
      price: 1250,
      tags: ['mock', 'preview'],
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      artisanId: 'MOCK_ARTISAN'
    };
    setNewItem(mockItem);
  };

  return { newItem, isConnected, mockPushItem };
};
