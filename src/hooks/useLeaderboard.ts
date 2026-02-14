import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useLeaderboard(
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' = 'weekly',
  limit?: number
) {
  return useQuery({
    queryKey: ['leaderboard', periodType, limit],
    queryFn: async () => {
      const { data: periodData, error: periodError } = await supabase.rpc(
        'get_period_dates',
        { p_period_type: periodType }
      );
      if (periodError) throw periodError;
      const period = periodData?.[0];
      if (!period) return [];

      let query = supabase
        .from('leaderboard_data')
        .select('*')
        .eq('period_type', periodType)
        .eq('period_start', period.start_date)
        .order('rank_by_points', { ascending: true });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for each user
      const userIds = data?.map(d => d.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(entry => ({
        ...entry,
        profile: profileMap.get(entry.user_id) || null,
      }));
    },
    staleTime: 60000,
    refetchInterval: 300000,
  });
}

export function useUserLeaderboardPosition(
  userId: string,
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' = 'weekly'
) {
  return useQuery({
    queryKey: ['leaderboard-position', userId, periodType],
    queryFn: async () => {
      const { data: periodData } = await supabase.rpc(
        'get_period_dates',
        { p_period_type: periodType }
      );
      const period = periodData?.[0];
      if (!period) return null;

      const { data, error } = await supabase
        .from('leaderboard_data')
        .select('*')
        .eq('user_id', userId)
        .eq('period_type', periodType)
        .eq('period_start', period.start_date)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useRefreshLeaderboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('refresh_all_leaderboards');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard-position'] });
      toast({ title: 'Leaderboard refreshed!' });
    },
  });
}
