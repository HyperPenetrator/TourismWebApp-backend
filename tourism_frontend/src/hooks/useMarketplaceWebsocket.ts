import { useState, useEffect } from 'react';

export interface MarketplaceItem {
  id: string;
  image_url: string;
  description: string;
  price: number;
  tags: string[];
  timestamp: number;
}

export const useMarketplaceWebsocket = (url: string) => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      console.log("Connected to Marketplace Stream");
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'new_item' && payload.data) {
          // Push new item to the top of the feed array
          setItems((prevItems) => [payload.data, ...prevItems]);
        }
      } catch (err) {
        console.error("Failed to parse websocket payload:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("Disconnected from Marketplace Stream");
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { items, isConnected };
};
