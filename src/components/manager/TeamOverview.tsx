import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Target, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamMembers, useTeamStats } from '@/hooks/useManagerDashboard';

interface TeamOverviewProps {
  onSelectMember?: (userId: string) => void;
}

export function TeamOverview({ onSelectMember }: TeamOverviewProps) {
  const { data: teamMembers, isLoading: membersLoading } = useTeamMembers();
  const { data: teamStats, isLoading: statsLoading } = useTeamStats();

  if (statsLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6"><Skeleton className="h-16 w-full" /></Card>
        ))}
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: 'Team Size', value: teamStats?.teamSize || 0, sub: 'Loan Officers', color: 'bg-primary' },
    { icon: Target, label: 'Total Points', value: teamStats?.totalPoints?.toLocaleString() || '0', sub: `Avg: ${teamStats?.avgPointsPerLO || 0} per LO`, color: 'bg-accent' },
    { icon: AlertTriangle, label: 'Active Alerts', value: teamStats?.alertCounts.critical || 0, sub: `${teamStats?.alertCounts.warning || 0} warnings`, color: 'bg-destructive' },
    { icon: TrendingUp, label: 'On PIP', value: teamStats?.activeOnPIP || 0, sub: 'Active plans', color: 'bg-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-2', stat.color)}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.sub && <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team members list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {membersLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : !teamMembers?.length ? (
            <p className="text-muted-foreground text-center py-8">No team members found.</p>
          ) : (
            teamMembers.map(member => {
              const initials = member.full_name
                ?.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase() || '?';

              return (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectMember?.(member.user_id)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{member.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.completion_avg.toFixed(0)}% completion · {member.activities_this_week} activities this week
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.active_alerts > 0 && (
                      <Badge variant="destructive" className="text-xs">{member.active_alerts} alerts</Badge>
                    )}
                    {member.pip_status === 'active' && (
                      <Badge className="bg-orange-500 text-white text-xs">PIP</Badge>
                    )}
                    {member.current_streak && member.current_streak >= 7 && (
                      <Badge variant="secondary" className="text-xs">🔥 {member.current_streak}d</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
