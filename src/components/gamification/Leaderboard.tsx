import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Target, DollarSign, Crown, Medal, Star, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaderboard, useUserLeaderboardPosition, useRefreshLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly';
type MetricType = 'points' | 'volume' | 'loans';

const tierColors: Record<string, string> = {
  Diamond: 'bg-gradient-to-r from-cyan-500 to-purple-600',
  Platinum: 'bg-gradient-to-r from-cyan-400 to-cyan-600',
  Gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  Silver: 'bg-gradient-to-r from-gray-300 to-gray-500',
  Bronze: 'bg-gradient-to-r from-orange-500 to-orange-700',
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return { icon: Crown, color: 'text-yellow-500' };
  if (rank === 2) return { icon: Medal, color: 'text-gray-400' };
  if (rank === 3) return { icon: Medal, color: 'text-orange-600' };
  return { icon: Star, color: 'text-muted-foreground' };
};

const formatNumber = (num: number | null) => {
  if (!num) return '0';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function Leaderboard() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [metric, setMetric] = useState<MetricType>('points');

  const { data: leaderboard, isLoading } = useLeaderboard(period);
  const { data: userPosition } = useUserLeaderboardPosition(userId || '', period);
  const refreshMutation = useRefreshLeaderboard();

  const getRank = (entry: any) => {
    if (metric === 'volume') return entry.rank_by_volume;
    if (metric === 'loans') return entry.rank_by_loans;
    return entry.rank_by_points;
  };

  const getValue = (entry: any) => {
    if (metric === 'volume') return formatNumber(entry.volume_closed);
    if (metric === 'loans') return entry.loans_closed ?? 0;
    return entry.total_points ?? 0;
  };

  const sorted = [...(leaderboard || [])].sort((a, b) => (getRank(a) || 999) - (getRank(b) || 999));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Leaderboard</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          <RefreshCw className={cn('w-4 h-4', refreshMutation.isPending && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* User's position card */}
      {userPosition && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Position</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  #{userPosition.rank_by_points ?? '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="text-2xl font-bold text-primary">{userPosition.total_points ?? 0}</p>
              </div>
              <div className="text-right">
                <Badge className={cn('text-white', tierColors[userPosition.tier || 'Bronze'])}>
                  {userPosition.tier || 'Bronze'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Metric selector */}
      <div className="flex gap-2">
        {[
          { key: 'points' as MetricType, icon: Target, label: 'Points' },
          { key: 'volume' as MetricType, icon: DollarSign, label: 'Volume' },
          { key: 'loans' as MetricType, icon: Target, label: 'Loans' },
        ].map(m => (
          <Button
            key={m.key}
            variant={metric === m.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetric(m.key)}
          >
            <m.icon className="w-4 h-4 mr-1" />
            {m.label}
          </Button>
        ))}
      </div>

      {/* Rankings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Rankings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : sorted.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No rankings yet for this period.</p>
          ) : (
            sorted.map((entry) => {
              const rank = getRank(entry) || 0;
              const { icon: RankIcon, color } = getRankIcon(rank);
              const isCurrentUser = entry.user_id === userId;
              const initials = (entry as any).profile?.full_name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase() || '?';

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                  )}
                >
                  <div className="w-8 text-center">
                    {rank <= 3 ? (
                      <RankIcon className={cn('w-5 h-5 mx-auto', color)} />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">{rank}</span>
                    )}
                  </div>

                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {(entry as any).profile?.full_name || 'Unknown'}
                      {isCurrentUser && (
                        <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-white text-xs', tierColors[entry.tier || 'Bronze'])}>
                        {entry.tier || 'Bronze'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {entry.completion_percentage?.toFixed(0)}% completion
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-foreground">{getValue(entry)}</p>
                    <p className="text-xs text-muted-foreground">
                      {metric === 'points' ? 'pts' : metric === 'volume' ? 'vol' : 'loans'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
