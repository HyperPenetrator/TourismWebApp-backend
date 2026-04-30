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
  id: string;
  image_url: string;
  description: string;
  price: number;
  tags: string[];
  timestamp: number;
}
