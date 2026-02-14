import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Flame, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MomentumScoreProps {
  score: number;
  currentStreak: number;
  longestStreak: number;
  dailyCompletionAvg: number;
  className?: string;
}

const TIERS = [
  { name: 'Bronze', min: 0, max: 199, gradient: 'from-orange-500 to-orange-700' },
  { name: 'Silver', min: 200, max: 399, gradient: 'from-gray-300 to-gray-500' },
  { name: 'Gold', min: 400, max: 599, gradient: 'from-yellow-400 to-yellow-600' },
  { name: 'Platinum', min: 600, max: 799, gradient: 'from-cyan-400 to-cyan-600' },
  { name: 'Diamond', min: 800, max: 1000, gradient: 'from-blue-500 to-purple-600' },
];

function getTier(score: number) {
  return TIERS.find(tier => score >= tier.min && score <= tier.max) || TIERS[0];
}

function getNextTier(score: number) {
  const currentTierIndex = TIERS.findIndex(tier => score >= tier.min && score <= tier.max);
  return currentTierIndex < TIERS.length - 1 ? TIERS[currentTierIndex + 1] : null;
}

export function MomentumScore({ score, currentStreak, longestStreak, dailyCompletionAvg, className }: MomentumScoreProps) {
  const currentTier = getTier(score);
  const nextTier = getNextTier(score);
  const progressToNext = nextTier
    ? ((score - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  const motivationalMessage = currentStreak >= 7
    ? `🔥 Amazing! ${currentStreak} days in a row. You're on fire!`
    : currentStreak >= 3
    ? '💪 Great momentum! Keep the streak alive.'
    : dailyCompletionAvg >= 75
    ? '⭐ Strong performance! Stay consistent.'
    : '🎯 Let\'s build momentum. Complete today\'s moves!';

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Momentum Score</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display font-bold text-foreground">{score}</span>
            <span className="text-sm text-muted-foreground">/1000</span>
          </div>
        </div>
        <div className={cn('w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center', currentTier.gradient)}>
          <Award className="w-8 h-8 text-white" />
        </div>
      </div>

      <Badge className={cn('text-white px-4 py-1 text-sm font-semibold mb-4', `bg-gradient-to-r ${currentTier.gradient}`)}>
        {currentTier.name} Tier
      </Badge>

      {nextTier && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{currentTier.name}</span>
            <span>{Math.round(progressToNext)}% to {nextTier.name}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={cn('h-2 rounded-full bg-gradient-to-r', currentTier.gradient)}
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{nextTier.min - score} points to {nextTier.name} tier</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-lg bg-muted">
          <Flame className="w-5 h-5 text-warning mx-auto mb-1" />
          <p className="text-lg font-display font-bold text-foreground">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted">
          <TrendingUp className="w-5 h-5 text-tertiary mx-auto mb-1" />
          <p className="text-lg font-display font-bold text-foreground">{longestStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted">
          <Award className="w-5 h-5 text-success mx-auto mb-1" />
          <p className="text-lg font-display font-bold text-foreground">{Math.round(dailyCompletionAvg)}%</p>
          <p className="text-xs text-muted-foreground">Avg Completion</p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm text-foreground">{motivationalMessage}</p>
      </div>
    </Card>
  );
}
