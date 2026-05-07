import { useState, useEffect, useCallback } from 'react';
import { MarketplaceItem } from '@/lib/types';

export const useMarketplaceItems = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/marketplace/items`);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.warn('[useMarketplaceItems] API returned non-array:', data);
        setItems([]);
        return;
      }

      const mapped = data.map((item: any) => ({
        id: String(item.id),
        image_url: item.image_url,
        description: item.description,
        price: item.list_price ?? item.price ?? 0,
        list_price: item.list_price ?? item.price ?? 0,
        tags: item.tags || [],
        timestamp: item.created_at || new Date().toISOString(),
        artisanId: item.seller_id ? String(item.seller_id) : 'anonymous'
      }));
      
      setItems(mapped);
    } catch (err) {
      console.error('[useMarketplaceItems] Failed to load history:', err);
      setError('Failed to load marketplace items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const prependItem = useCallback((newItem: MarketplaceItem) => {
    setItems(prev => {
      if (prev.some(i => i.id === newItem.id)) return prev;
      return [newItem, ...prev];
    });
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, isLoading, error, fetchItems, prependItem };
};
