import { useState, useEffect, useCallback, useRef } from 'react';

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
  imageUrl: string;
  artisanId: string;
  createdAt: string;
}

export const useMarketplaceWebSocket = (url: string) => {
  const [newItem, setNewItem] = useState<MarketplaceItem | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log(`[Marketplace WS] Connected to ${url}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Assuming the backend sends { type: 'NEW_ITEM', payload: MarketplaceItem }
          if (data.type === 'NEW_ITEM' && data.payload) {
            setNewItem(data.payload);
          }
        } catch (err) {
          console.error('[Marketplace WS] Failed to parse message', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[Marketplace WS] Disconnected. Reconnecting in 3s...');
        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        setError(err);
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[Marketplace WS] Connection error', err);
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on explicit unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Provide a function to mock a push event for demonstration/testing
  const mockPushItem = useCallback((item: MarketplaceItem) => {
    setNewItem(item);
  }, []);

  return { newItem, isConnected, error, mockPushItem };
};
