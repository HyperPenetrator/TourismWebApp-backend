import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { MarketplaceItem } from '@/lib/types';

export const useMarketplaceWebsocket = (url: string) => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  
  const { isConnected } = useWebSocket(url, {
    onMessage: (payload) => {
      if (payload.event === 'new_item' && payload.data) {
        // Push new item to the top of the feed array
        setItems((prevItems) => [payload.data, ...prevItems]);
      }
    }
  });

  return { items, isConnected };
};
