import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface NotificationItem {
  id: string;
  message: string;
  item_id: number;
  buyer: string;
  buyer_username?: string;
  timestamp: string;
  read: boolean;
}

export function usePersonalNotificationsSSE() {
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { token, isAuthenticated } = useAuth();

  // Hydrate from REST on mount
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: any[]) => {
        const mapped: NotificationItem[] = data.map((n) => ({
          id: String(n.id),
          message: n.message,
          item_id: n.item_id,
          buyer: n.buyer_username || '',
          timestamp: n.created_at || new Date().toISOString(),
          read: n.read,
        }));
        setNotifications(mapped);
      })
      .catch((e) => console.error('[Notifications] Failed to load history:', e));
  }, [token, isAuthenticated]);

  // Live SSE stream
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let eventSource: EventSource;
    const connect = () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/sse/notifications?token=${token}`;
      console.log('[SSE] Connecting to personal notifications...');
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('[SSE] Notifications feed connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'new_order') {
            const newNotif: NotificationItem = {
              id: data.data.id || Math.random().toString(),
              message: data.data.message,
              item_id: data.data.item_id,
              buyer: data.data.buyer,
              timestamp: data.data.timestamp || new Date().toISOString(),
              read: false,
            };
            setNotification(newNotif);
            setNotifications(prev => [newNotif, ...prev]);
          }
        } catch (e) {
          console.error('Error parsing notification data', e);
        }
      };

      eventSource.onerror = (error) => {
        setIsConnected(false);
        console.error('[SSE] Notifications error:', error);
        eventSource.close();
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
        setIsConnected(false);
      }
    };
  }, [token, isAuthenticated]);

  const markRead = async (id: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      await fetch(`${apiUrl}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error('[Notifications] Failed to mark as read:', e);
    }
  };

  return { notification, notifications, isConnected, clearNotification: () => setNotification(null), markRead };
}
