import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useCelebrationFeed(limit: number = 20) {
  return useQuery({
    queryKey: ['celebration-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('celebration_feed')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set(data?.map(d => d.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(c => ({
        ...c,
        profile: profileMap.get(c.user_id) || null,
      }));
    },
  });
}

export function useCreateCelebration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (celebration: {
      user_id: string;
      celebration_type: string;
      title: string;
      description?: string;
      achievement_id?: string;
      metadata?: any;
      is_public?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('celebration_feed')
        .insert([celebration])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['celebration-feed'] });
      toast({ title: 'Celebration posted!', description: 'Your achievement has been shared.' });
    },
  });
}

export function useLikeCelebration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ celebrationId, userId }: { celebrationId: string; userId: string }) => {
      const { data: existing } = await supabase
        .from('celebration_likes')
        .select('id')
        .eq('celebration_id', celebrationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase.from('celebration_likes').delete().eq('id', existing.id);
        return { liked: false };
      } else {
        await supabase.from('celebration_likes').insert([{ celebration_id: celebrationId, user_id: userId }]);
        return { liked: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['celebration-feed'] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ celebrationId, userId, comment }: { celebrationId: string; userId: string; comment: string }) => {
      const { data, error } = await supabase
        .from('celebration_comments')
        .insert([{ celebration_id: celebrationId, user_id: userId, comment }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['celebration-feed'] });
      toast({ title: 'Comment added' });
    },
  });
}

export function useCelebrationComments(celebrationId: string) {
  return useQuery({
    queryKey: ['celebration-comments', celebrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('celebration_comments')
        .select('*')
        .eq('celebration_id', celebrationId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const userIds = [...new Set(data?.map(d => d.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(c => ({
        ...c,
        profile: profileMap.get(c.user_id) || null,
      }));
    },
    enabled: !!celebrationId,
  });
}
