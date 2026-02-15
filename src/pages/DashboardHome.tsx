import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MomentumScore } from '@/components/coaching/MomentumScore';
import { DailyPowerMoves } from '@/components/coaching/DailyPowerMoves';
import { QuickStats } from '@/components/coaching/QuickStats';
import { MorningKickoff } from '@/components/coaching/MorningKickoff';
import { EveningDebrief } from '@/components/coaching/EveningDebrief';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { toast } from 'sonner';

const DashboardHome = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const [showMorningKickoff, setShowMorningKickoff] = useState(false);
  const [showEveningDebrief, setShowEveningDebrief] = useState(false);

  // Profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Today's power moves
  const { data: powerMoves, isLoading: movesLoading } = useQuery({
    queryKey: ['power-moves', userId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_power_moves')
        .select('*')
        .eq('user_id', userId!)
        .eq('assigned_date', today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Today's activities count & points
  const { data: todayStats, isLoading: statsLoading } = useQuery({
    queryKey: ['today-stats-dashboard', userId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('points')
        .eq('user_id', userId!)
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`);
      if (error) throw error;
      const count = data?.length ?? 0;
      const points = data?.reduce((sum, a) => sum + (a.points ?? 0), 0) ?? 0;
      return { count, points };
    },
    enabled: !!userId,
  });

  // Weekly points
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const { data: weeklyPoints } = useQuery({
    queryKey: ['weekly-points', userId, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('points')
        .eq('user_id', userId!)
        .gte('completed_at', `${weekStart}T00:00:00`);
      if (error) throw error;
      return data?.reduce((sum, a) => sum + (a.points ?? 0), 0) ?? 0;
    },
    enabled: !!userId,
  });

  // Contacts touched this week
  const { data: contactsTouched } = useQuery({
    queryKey: ['contacts-touched', userId, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('contact_id')
        .eq('user_id', userId!)
        .gte('completed_at', `${weekStart}T00:00:00`)
        .not('contact_id', 'is', null);
      if (error) throw error;
      const unique = new Set(data?.map(a => a.contact_id));
      return unique.size;
    },
    enabled: !!userId,
  });

  // Monthly volume & closed loans
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const { data: monthlyMetrics } = useQuery({
    queryKey: ['monthly-metrics', userId, monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard_data')
        .select('volume_closed, loans_closed')
        .eq('user_id', userId!)
        .eq('period_type', 'monthly')
        .gte('period_start', monthStart)
        .maybeSingle();
      if (error) return { volume: 0, loans: 0 };
      return { volume: data?.volume_closed ?? 0, loans: data?.loans_closed ?? 0 };
    },
    enabled: !!userId,
  });

  // Yesterday's completion
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const { data: yesterdayCompletion } = useQuery({
    queryKey: ['yesterday-completion', userId, yesterday],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_power_moves')
        .select('completion_percentage')
        .eq('user_id', userId!)
        .eq('assigned_date', yesterday)
        .maybeSingle();
      if (error) return 0;
      return data?.completion_percentage ?? 0;
    },
    enabled: !!userId,
  });

  // Yesterday's points for trend
  const { data: yesterdayPoints } = useQuery({
    queryKey: ['yesterday-points', userId, yesterday],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('points')
        .eq('user_id', userId!)
        .gte('completed_at', `${yesterday}T00:00:00`)
        .lte('completed_at', `${yesterday}T23:59:59`);
      if (error) return 0;
      return data?.reduce((sum, a) => sum + (a.points ?? 0), 0) ?? 0;
    },
    enabled: !!userId,
  });

  // Complete move mutation
  const completeMutation = useMutation({
    mutationFn: async (moveNumber: 1 | 2 | 3) => {
      if (!powerMoves) return;
      const now = new Date().toISOString();
      const completedCount = [
        moveNumber === 1 ? true : powerMoves.move_1_completed,
        moveNumber === 2 ? true : powerMoves.move_2_completed,
        moveNumber === 3 ? true : powerMoves.move_3_completed,
      ].filter(Boolean).length;

      const { error } = await supabase
        .from('daily_power_moves')
        .update({
          [`move_${moveNumber}_completed`]: true,
          [`move_${moveNumber}_completed_at`]: now,
          completion_percentage: Math.round((completedCount / 3) * 100),
          total_points: (powerMoves.move_1_points ?? 0) + (powerMoves.move_2_points ?? 0) + (powerMoves.move_3_points ?? 0),
        })
        .eq('id', powerMoves.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['power-moves'] });
      toast.success('Power move completed! 🎯');
    },
    onError: () => toast.error('Failed to complete move'),
  });

  // Show morning kickoff check
  useEffect(() => {
    const kickoffKey = `morning-kickoff-${today}`;
    if (!localStorage.getItem(kickoffKey) && profile) {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) {
        setShowMorningKickoff(true);
        localStorage.setItem(kickoffKey, 'true');
      }
    }
  }, [profile, today]);

  const userName = profile?.full_name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'there';

  const pointsChange = yesterdayPoints
    ? Math.round(((todayStats?.points ?? 0) - yesterdayPoints) / Math.max(yesterdayPoints, 1) * 100)
    : undefined;

  const isLoading = profileLoading || movesLoading || statsLoading;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome Back, {userName}</h1>
          <p className="text-muted-foreground mt-1">Here's your coaching overview for today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMorningKickoff(true)}>
            <Sun className="w-4 h-4 mr-1" /> Kickoff
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEveningDebrief(true)}>
            <Moon className="w-4 h-4 mr-1" /> Debrief
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MomentumScore
            score={profile?.momentum_score ?? 0}
            currentStreak={profile?.current_streak ?? 0}
            longestStreak={profile?.longest_streak ?? 0}
            dailyCompletionAvg={Number(profile?.daily_completion_avg ?? 0)}
          />
          <DailyPowerMoves
            powerMoves={powerMoves ?? null}
            onCompleteMove={(num) => completeMutation.mutate(num)}
            isLoading={completeMutation.isPending}
            className="lg:col-span-2"
          />
        </div>
      )}

      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <QuickStats
          todayPoints={todayStats?.points ?? 0}
          weeklyPoints={weeklyPoints ?? 0}
          contactsTouched={contactsTouched ?? 0}
          activitiesLogged={todayStats?.count ?? 0}
          monthlyVolume={monthlyMetrics?.volume ?? 0}
          closedLoans={monthlyMetrics?.loans ?? 0}
          pointsChange={pointsChange}
        />
      )}

      <MorningKickoff
        isOpen={showMorningKickoff}
        onClose={() => setShowMorningKickoff(false)}
        userName={userName}
        powerMoves={powerMoves ?? null}
        currentStreak={profile?.current_streak ?? 0}
        yesterdayCompletion={yesterdayCompletion ?? 0}
      />

      <EveningDebrief
        isOpen={showEveningDebrief}
        onClose={() => setShowEveningDebrief(false)}
        powerMoves={powerMoves ?? null}
        todayPoints={todayStats?.points ?? 0}
        activitiesLogged={todayStats?.count ?? 0}
      />
    </div>
  );
};

export default DashboardHome;
