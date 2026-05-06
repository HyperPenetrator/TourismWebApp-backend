import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketplaceItem } from '@/lib/types';


export const useMarketplaceFeedWS = (url: string) => {
  const [newItem, setNewItem] = useState<MarketplaceItem | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('[Marketplace WS] Connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const item: MarketplaceItem = JSON.parse(event.data);
          setNewItem(item);
        } catch (err) {
          console.error('[Marketplace WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('[Marketplace WS] Disconnected');
        setIsConnected(false);
        // Attempt reconnection after 5s
        setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error('[Marketplace WS] Error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[Marketplace WS] Connection error:', err);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent reconnect on unmount
        socketRef.current.close();
      }
    };
  }, [connect]);

  // For development/demo purposes
  const mockPushItem = useCallback((item: MarketplaceItem) => {
    setNewItem(item);
  }, []);

  return { newItem, isConnected, mockPushItem };
};
