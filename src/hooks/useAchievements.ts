import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('points_bonus', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUserAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`*, achievement:achievements(*)`)
        .eq('user_id', userId!)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useMarkAchievementCelebrated() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (achievementId: string) => {
      const { error } = await supabase
        .from('user_achievements')
        .update({ celebrated: true, celebrated_at: new Date().toISOString() })
        .eq('id', achievementId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });
}
