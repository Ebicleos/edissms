import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSignedPhotoUrl(photoPath: string | null | undefined, expiresIn: number = 3600) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!photoPath) {
        setSignedUrl(null);
        return;
      }

      // If it's already a full URL (legacy data), use it directly
      if (photoPath.startsWith('http')) {
        setSignedUrl(photoPath);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('student-photos')
          .createSignedUrl(photoPath, expiresIn);

        if (error) {
          console.error('Error creating signed URL:', error);
          setSignedUrl(null);
        } else {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setSignedUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSignedUrl();
  }, [photoPath, expiresIn]);

  return { signedUrl, isLoading };
}
