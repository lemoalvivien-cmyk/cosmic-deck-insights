import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicConfig {
  maintenance_mode: boolean;
  enable_waitlist: boolean;
}

/**
 * Hook to fetch public configuration (maintenance_mode, enable_waitlist)
 * Uses an Edge Function to avoid exposing the full feature_flags table
 * Safe for unauthenticated users
 */
export function usePublicConfig() {
  return useQuery({
    queryKey: ['public-config'],
    queryFn: async (): Promise<PublicConfig> => {
      const { data, error } = await supabase.functions.invoke('public-config', {
        method: 'GET',
      });

      if (error) {
        console.error('[usePublicConfig] Error fetching config:', error);
        // Return safe defaults on error
        return { maintenance_mode: false, enable_waitlist: false };
      }

      return {
        maintenance_mode: data?.maintenance_mode ?? false,
        enable_waitlist: data?.enable_waitlist ?? false,
      };
    },
    staleTime: 30000, // 30 seconds - matches edge function cache
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
