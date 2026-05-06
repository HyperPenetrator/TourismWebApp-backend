export interface WeavingMetrics {
  weave_complexity: string;
  current_progress: string;
  shuttle_speed: string;
  pattern_integrity: string;
  estimated_completion_time: string;
  status: string;
}

export interface HUDData {
  timestamp: number;
  artisan_id: string;
  metrics: WeavingMetrics;
  alerts: string[];
}

export interface MarketplaceItem {
  id: string | number;
  title?: string;
  description: string;
  price: number;
  list_price?: number;
  image_url?: string;
  imageUrl?: string;
  tags: string[];
  timestamp?: number | string;
  createdAt?: string;
  created_at?: string;
  seller_id?: number;
  artisanId?: string;
}
