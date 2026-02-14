import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Users, DollarSign, Target, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

function StatCard({ label, value, change, changeLabel, icon: Icon, trend = 'neutral', className }: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-tertiary';

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1', trendColor)}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{Math.abs(change)}%</span>
              {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}

interface QuickStatsProps {
  todayPoints: number;
  weeklyPoints: number;
  contactsTouched: number;
  activitiesLogged: number;
  monthlyVolume: number;
  closedLoans: number;
  pointsChange?: number;
  contactsChange?: number;
  className?: string;
}

export function QuickStats({
  todayPoints, weeklyPoints, contactsTouched, activitiesLogged,
  monthlyVolume, closedLoans, pointsChange, contactsChange, className
}: QuickStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-3 gap-3', className)}>
      <StatCard
        label="Today's Points" value={todayPoints} icon={Target}
        change={pointsChange} changeLabel="vs yesterday"
        trend={pointsChange && pointsChange > 0 ? 'up' : pointsChange && pointsChange < 0 ? 'down' : 'neutral'}
      />
      <StatCard label="Weekly Points" value={weeklyPoints} icon={Activity} />
      <StatCard
        label="Contacts Touched" value={contactsTouched} icon={Users}
        change={contactsChange} changeLabel="this week"
        trend={contactsChange && contactsChange > 0 ? 'up' : contactsChange && contactsChange < 0 ? 'down' : 'neutral'}
      />
      <StatCard label="Activities Logged" value={activitiesLogged} icon={Activity} />
      <StatCard label="Monthly Volume" value={`$${(monthlyVolume / 1000000).toFixed(1)}M`} icon={DollarSign} />
      <StatCard label="Closed This Month" value={`${closedLoans} loans`} icon={TrendingUp} />
    </div>
  );
}
