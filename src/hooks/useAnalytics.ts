import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============ TYPES ============

export interface ActivityTrend {
  period: string;
  total_activities: number;
  total_points: number;
  calls_count: number;
  emails_count: number;
  meetings_count: number;
  unique_contacts: number;
}

export interface ComplianceBreakdown {
  category: string;
  total: number;
  completed: number;
  pending: number;
  completion_rate: number;
}

export interface TeamPerformance {
  user_id: string;
  full_name: string;
  total_activities: number;
  total_points: number;
  momentum_score: number;
  current_streak: number;
  rank: number;
}

// ============ ACTIVITY TRENDS ============

export const useActivityTrends = (
  userId?: string,
  startDate?: Date,
  endDate?: Date,
  grouping: 'day' | 'week' | 'month' = 'day'
) => {
  return useQuery({
    queryKey: ['activity-trends', userId, startDate?.toISOString(), endDate?.toISOString(), grouping],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_activity_trends', {
        p_user_id: userId || null,
        p_start_date: (startDate || new Date(Date.now() - 30 * 86400000)).toISOString(),
        p_end_date: (endDate || new Date()).toISOString(),
        p_grouping: grouping,
      });
      if (error) throw error;
      return (data || []) as ActivityTrend[];
    },
  });
};

// ============ COMPLIANCE BREAKDOWN ============

export const useComplianceBreakdown = (userId?: string) => {
  return useQuery({
    queryKey: ['compliance-breakdown', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_compliance_breakdown', {
        p_user_id: userId || null,
      });
      if (error) throw error;
      return (data || []) as ComplianceBreakdown[];
    },
  });
};

// ============ TEAM PERFORMANCE ============

export const useTeamPerformance = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['team-performance', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_performance_comparison', {
        p_start_date: (startDate || new Date(Date.now() - 30 * 86400000)).toISOString(),
        p_end_date: (endDate || new Date()).toISOString(),
      });
      if (error) throw error;
      return (data || []) as TeamPerformance[];
    },
  });
};

// ============ SAVED REPORTS ============

export const useSavedReports = () => {
  return useQuery({
    queryKey: ['saved-reports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('saved_reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (report: { report_name: string; report_type: string; filters?: Record<string, unknown>; columns?: string[]; date_range?: Record<string, unknown> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const insertData = {
        report_name: report.report_name,
        report_type: report.report_type,
        user_id: user!.id,
      } as any;
      const { data, error } = await supabase
        .from('saved_reports')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      toast({ title: 'Report Saved', description: 'Your report has been saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase.from('saved_reports').delete().eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      toast({ title: 'Report Deleted' });
    },
  });
};
