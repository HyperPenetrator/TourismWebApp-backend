import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export const useMarketplaceUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const uploadItem = useCallback(async (data: {
    file: File;
    description: string;
    price: string;
    tags: string[];
  }) => {
    if (!token) {
      setError('Authentication required');
      return false;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', data.file);
    formData.append('description', data.description);
    formData.append('price', data.price);
    formData.append('tags', data.tags.join(','));

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/api/marketplace/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      return true;
    } catch (err: any) {
      console.error('[useMarketplaceUpload] Upload failed:', err);
      setError(err.message || 'Upload failed');
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [token]);

  return { uploadItem, isUploading, error };
};
