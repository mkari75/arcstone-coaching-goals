import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

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
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
