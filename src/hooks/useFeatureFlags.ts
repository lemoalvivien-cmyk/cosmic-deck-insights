import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlags {
  id: number;
  maintenance_mode: boolean;
  enable_shop: boolean;
  enable_billing: boolean;
  enable_waitlist: boolean;
  admin_bootstrap_used: boolean;
  updated_at: string;
}

/**
 * Hook to fetch all feature flags - REQUIRES AUTHENTICATION
 * This should only be used in admin contexts where the user is authenticated
 * For public config (maintenance_mode, enable_waitlist), use usePublicConfig instead
 */
export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<FeatureFlags> => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('[useFeatureFlags] Error - requires authentication:', error);
        throw error;
      }
      return data as FeatureFlags;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
