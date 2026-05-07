import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export const useEngagement = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { token } = useAuth();

  const engage = useCallback(async (postId: string, action: 'like' | 'comment' | 'reshare', text?: string) => {
    if (!token) return false;
    
    setIsProcessing(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/posts/${postId}/engage?action=${action}${text ? `&text=${encodeURIComponent(text)}` : ''}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (err) {
      console.error('[useEngagement] Failed to engage:', err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [token]);

  return { engage, isProcessing };
};
