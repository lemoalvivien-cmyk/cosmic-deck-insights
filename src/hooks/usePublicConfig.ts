import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicConfig {
  maintenance_mode: boolean;
  enable_waitlist: boolean;
}

const SAFE_DEFAULTS: PublicConfig = {
  maintenance_mode: false,
  enable_waitlist: false,
};

/**
 * Hook to fetch public configuration (maintenance_mode, enable_waitlist)
 * Uses an Edge Function to avoid exposing the full feature_flags table
 * Safe for unauthenticated users
 * 
 * IMPORTANT: Returns safe defaults on any error so the app remains usable
 * even when the backend is unavailable.
 */
export function usePublicConfig() {
  return useQuery({
    queryKey: ['public-config'],
    queryFn: async (): Promise<PublicConfig> => {
      try {
        const { data, error } = await supabase.functions.invoke('public-config', {
          method: 'GET',
        });

        if (error) {
          console.warn('[usePublicConfig] Invoke error, using defaults:', error.message);
          return SAFE_DEFAULTS;
        }

        // The edge function returns { error: "..." } on 500 — handle it
        if (data?.error) {
          console.warn('[usePublicConfig] Backend error, using defaults:', data.error);
          return SAFE_DEFAULTS;
        }

        return {
          maintenance_mode: data?.maintenance_mode ?? false,
          enable_waitlist: data?.enable_waitlist ?? false,
        };
      } catch (e) {
        console.warn('[usePublicConfig] Network error, using defaults');
        return SAFE_DEFAULTS;
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
    retry: 1, // Only 1 retry to avoid long waits when backend is down
    retryDelay: 2000,
  });
}
