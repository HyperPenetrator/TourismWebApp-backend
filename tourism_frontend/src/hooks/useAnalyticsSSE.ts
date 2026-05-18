'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface AnalyticsSnapshot {
  total_requests: number;
  requests_per_minute: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  error_count: number;
  error_rate_pct: number;
  unique_visitors: number;
  top_paths: { path: string; count: number }[];
  status_distribution: Record<string, number>;
  method_distribution: Record<string, number>;
  latency_trend: number[];
  requests_trend: number[];
  timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * SSE hook for real-time analytics.
 * Follows the same exponential-backoff reconnection pattern as useMarketplaceFeedSSE.
 * 
 * Security: Token is passed as a query param for SSE (EventSource doesn't support
 * custom headers). The backend validates it before accepting the connection.
 */
export const useAnalyticsSSE = (token: string | null) => {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryDelayRef = useRef(2000);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!token) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setError(null);
    console.log('[SSE] Connecting to Analytics stream...');

    // For SSE, we must pass the token as a query parameter since EventSource
    // doesn't support custom headers. The backend validates this JWT.
    const url = `${API_URL}/api/analytics/live?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('[SSE] Analytics stream connected');
      setIsConnected(true);
      setError(null);
      retryDelayRef.current = 2000;
    };

    es.onmessage = (event) => {
      try {
        const data: AnalyticsSnapshot = JSON.parse(event.data);
        setSnapshot(data);
      } catch (err) {
        console.error('[SSE] Error parsing analytics data:', err);
      }
    };

    es.onerror = () => {
      console.warn(`[SSE] Analytics stream error — retrying in ${retryDelayRef.current / 1000}s`);
      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;

      retryTimerRef.current = setTimeout(() => {
        retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30000);
        connect();
      }, retryDelayRef.current);
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [connect]);

  return { snapshot, isConnected, error };
};
