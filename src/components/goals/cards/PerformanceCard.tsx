import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import { formatCurrency, formatCurrencyShort } from '@/lib/calculations';

interface PerformanceCardProps {
  title: string;
  actual: number;
  goal: number;
  achievement: number;
  format?: 'currency' | 'number' | 'percentage';
  icon?: React.ReactNode;
  compact?: boolean;
}

export function PerformanceCard({
  title, actual, goal, achievement, format = 'currency', icon, compact = false,
}: PerformanceCardProps) {
  const formatValue = (value: number): string => {
    if (format === 'currency') return compact ? formatCurrencyShort(value) : formatCurrency(value);
    if (format === 'percentage') return `${value.toFixed(1)}%`;
    return value.toLocaleString();
  };

  const getAchievementColor = (ach: number): string => {
    if (ach >= 100) return 'text-green-600 bg-green-50 border-green-200';
    if (ach >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (ach >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const isOnTrack = achievement >= 75;
  const pct = Math.min(achievement, 100);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {isOnTrack && <TrendingUp className="h-4 w-4 text-green-600" />}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Actual</span>
            <div className="text-lg font-bold text-foreground">{formatValue(actual)}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Goal</span>
            <div className="text-lg font-bold text-foreground">{formatValue(goal)}</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Achievement</span>
          <Badge variant="outline" className={getAchievementColor(achievement)}>
            {achievement.toFixed(0)}%
          </Badge>
        </div>
        <Progress value={pct} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {achievement >= 100 ? '🎉 Goal exceeded!' :
           achievement >= 75 ? '✅ On track' :
           achievement >= 50 ? '⚠️ Needs attention' : '❌ Behind goal'}
        </p>
      </CardContent>
    </Card>
  );
}
