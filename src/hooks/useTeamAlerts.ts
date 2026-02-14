import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useTeamAlerts(resolved: boolean = false) {
  return useQuery({
    queryKey: ['team-alerts', resolved],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_alerts')
        .select('*')
        .eq('resolved', resolved)
        .order('triggered_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles for loan officers
      const loIds = [...new Set(data?.map(d => d.loan_officer_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', loIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(alert => ({
        ...alert,
        profile: profileMap.get(alert.loan_officer_id) || null,
      }));
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ alertId, resolvedBy, resolutionNote }: {
      alertId: string; resolvedBy: string; resolutionNote?: string;
    }) => {
      const { data, error } = await supabase
        .from('team_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          resolution_note: resolutionNote,
        })
        .eq('id', alertId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-alerts'] });
      toast({ title: 'Alert resolved' });
    },
  });
}

export function useGenerateAlerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('generate_team_alerts');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-alerts'] });
      toast({ title: 'Alerts refreshed', description: 'Team alerts have been updated.' });
    },
  });
}
