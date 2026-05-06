import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketplaceItem } from '@/lib/types';

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
        const item = data.event === 'new_item' ? data.data : data;
        setNewItem(item);
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

  const mockPushItem = () => {
    const mockItem: MarketplaceItem = {
      id: `mock_${Math.floor(Math.random() * 1000)}`,
      image_url: `https://picsum.photos/seed/${Math.random()}/400/400`,
      description: 'Mock Artisan Product (Client-Side Push)',
      price: 1250,
      tags: ['mock', 'preview'],
      timestamp: Date.now()
    };
    setNewItem(mockItem);
  };

  return { newItem, isConnected, mockPushItem };
};
