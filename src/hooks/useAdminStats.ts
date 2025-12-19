import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalUsers: number;
  totalReadings: number;
  todayReadings: number;
  recentReadings: Array<{
    id: string;
    created_at: string;
    question: string | null;
    cards: unknown;
  }>;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get total readings count
      const { count: totalReadings, error: readingsError } = await supabase
        .from('tarot_readings')
        .select('*', { count: 'exact', head: true });

      if (readingsError) throw readingsError;

      // Get today's readings count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayReadings, error: todayError } = await supabase
        .from('tarot_readings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      // Get recent readings (last 10)
      const { data: recentReadings, error: recentError } = await supabase
        .from('tarot_readings')
        .select('id, created_at, question, cards')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      return {
        totalUsers: totalUsers ?? 0,
        totalReadings: totalReadings ?? 0,
        todayReadings: todayReadings ?? 0,
        recentReadings: recentReadings ?? [],
      };
    },
    staleTime: 60000, // 1 minute
  });
}
