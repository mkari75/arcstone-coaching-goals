import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  current_streak: number | null;
  momentum_score: number | null;
  pip_status: string | null;
  total_points_this_month: number;
  completion_avg: number;
  activities_this_week: number;
  active_alerts: number;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      // Get all loan officer user_ids
      const { data: roles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'loan_officer');
      if (rolesErr) throw rolesErr;
      if (!roles?.length) return [];

      const loIds = roles.map(r => r.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', loIds);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      // Get activities this month for all LOs
      const { data: activities } = await supabase
        .from('activities')
        .select('user_id, points, completed_at')
        .in('user_id', loIds)
        .gte('completed_at', monthStart.toISOString());

      // Get power moves last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const { data: powerMoves } = await supabase
        .from('daily_power_moves')
        .select('user_id, completion_percentage')
        .in('user_id', loIds)
        .gte('assigned_date', thirtyDaysAgo);

      // Get alerts
      const { data: alerts } = await supabase
        .from('team_alerts')
        .select('loan_officer_id')
        .in('loan_officer_id', loIds)
        .eq('resolved', false);

      return (profiles || []).map(p => {
        const userActivities = activities?.filter(a => a.user_id === p.user_id) || [];
        const userPM = powerMoves?.filter(pm => pm.user_id === p.user_id) || [];
        const weekActivities = userActivities.filter(a =>
          new Date(a.completed_at || '') >= weekStart
        );
        const userAlerts = alerts?.filter(a => a.loan_officer_id === p.user_id) || [];

        return {
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          avatar_url: p.avatar_url,
          current_streak: p.current_streak,
          momentum_score: p.momentum_score,
          pip_status: p.pip_status,
          total_points_this_month: userActivities.reduce((s, a) => s + (a.points || 0), 0),
          completion_avg: userPM.length
            ? userPM.reduce((s, pm) => s + (pm.completion_percentage || 0), 0) / userPM.length
            : 0,
          activities_this_week: weekActivities.length,
          active_alerts: userAlerts.length,
        } as TeamMember;
      });
    },
  });
}

export function useTeamStats() {
  return useQuery({
    queryKey: ['team-stats'],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'loan_officer');
      if (!roles?.length) return null;

      const loIds = roles.map(r => r.user_id);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [
        { data: activities },
        { data: alerts },
        { data: pipRecords },
      ] = await Promise.all([
        supabase.from('activities').select('points, user_id').in('user_id', loIds).gte('completed_at', monthStart.toISOString()),
        supabase.from('team_alerts').select('severity').in('loan_officer_id', loIds).eq('resolved', false),
        supabase.from('pip_records').select('user_id').in('user_id', loIds).eq('current_status', 'active'),
      ]);

      const totalPoints = activities?.reduce((s, a) => s + (a.points || 0), 0) || 0;

      return {
        teamSize: loIds.length,
        totalPoints,
        avgPointsPerLO: loIds.length > 0 ? Math.round(totalPoints / loIds.length) : 0,
        alertCounts: {
          critical: alerts?.filter(a => a.severity === 'critical').length || 0,
          warning: alerts?.filter(a => a.severity === 'warning').length || 0,
          info: alerts?.filter(a => a.severity === 'info').length || 0,
        },
        activeOnPIP: pipRecords?.length || 0,
      };
    },
  });
}
