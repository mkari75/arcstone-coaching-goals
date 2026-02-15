import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { format } from 'date-fns';

export const ACTIVITY_POINTS: Record<string, number> = {
  phone_call: 5,
  text_message: 2,
  email: 3,
  meeting: 10,
  follow_up: 4,
  referral: 15,
};

export const ACTIVITY_LABELS: Record<string, string> = {
  phone_call: 'Phone Call',
  text_message: 'Text Message',
  email: 'Email',
  meeting: 'Meeting',
  follow_up: 'Follow Up',
  referral: 'Referral',
};

export function useContacts(userId: string | undefined) {
  return useQuery({
    queryKey: ['contacts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId!)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useActivities(userId: string | undefined, filters?: { dateFrom?: string; dateTo?: string; activityType?: string; search?: string }) {
  return useQuery({
    queryKey: ['activities', userId, filters],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select('*, contacts(name)')
        .eq('user_id', userId!)
        .order('completed_at', { ascending: false });

      if (filters?.dateFrom) query = query.gte('completed_at', `${filters.dateFrom}T00:00:00`);
      if (filters?.dateTo) query = query.lte('completed_at', `${filters.dateTo}T23:59:59`);
      if (filters?.activityType) query = query.eq('activity_type', filters.activityType);
      if (filters?.search) query = query.or(`description.ilike.%${filters.search}%,activity_type.ilike.%${filters.search}%`);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useTodayStats(userId: string | undefined) {
  const today = format(new Date(), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['today-stats', userId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('activity_type, points')
        .eq('user_id', userId!)
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`);
      if (error) throw error;

      const count = data.length;
      const totalPoints = data.reduce((sum, a) => sum + (a.points ?? 0), 0);
      const breakdown: Record<string, number> = {};
      data.forEach(a => { breakdown[a.activity_type] = (breakdown[a.activity_type] || 0) + 1; });

      return { count, totalPoints, breakdown };
    },
    enabled: !!userId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: TablesInsert<'activities'>) => {
      const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-activities'] });
      queryClient.invalidateQueries({ queryKey: ['today-points'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
