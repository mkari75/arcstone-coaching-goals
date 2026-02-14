import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, CheckCircle2, Circle, Phone, Mail, Users, Calendar, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type DailyPowerMove = Tables<'daily_power_moves'>;

interface DailyPowerMovesProps {
  powerMoves: DailyPowerMove | null;
  onCompleteMove: (moveNumber: 1 | 2 | 3) => void;
  isLoading?: boolean;
  className?: string;
}

interface MoveItemProps {
  moveNumber: 1 | 2 | 3;
  description: string;
  completed: boolean;
  completedAt?: string | null;
  points: number;
  onComplete: () => void;
  isLoading?: boolean;
}

function MoveItem({ moveNumber, description, completed, completedAt, points, onComplete, isLoading }: MoveItemProps) {
  const getIcon = () => {
    if (description.toLowerCase().includes('call')) return Phone;
    if (description.toLowerCase().includes('email')) return Mail;
    if (description.toLowerCase().includes('meeting')) return Users;
    return Target;
  };
  const Icon = getIcon();

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border transition-all',
      completed ? 'bg-success/5 border-success/20' : 'bg-card border-border hover:border-primary/30'
    )}>
      <Checkbox
        checked={completed}
        onCheckedChange={onComplete}
        disabled={completed || isLoading}
        className="w-6 h-6 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="default" className="text-xs font-semibold">
            <Icon className="w-3 h-3 mr-1" />
            Move {moveNumber}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {points} pts
          </span>
        </div>
        <p className={cn('text-sm', completed ? 'line-through text-muted-foreground' : 'text-foreground')}>
          {description}
        </p>
        {completed && completedAt && (
          <p className="text-xs text-success flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed at {format(new Date(completedAt), 'h:mm a')}
          </p>
        )}
      </div>
    </div>
  );
}

export function DailyPowerMoves({ powerMoves, onCompleteMove, isLoading, className }: DailyPowerMovesProps) {
  if (!powerMoves) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center py-8">
          <Circle className="w-12 h-12 text-tertiary mx-auto mb-3" />
          <p className="text-foreground font-medium">No power moves assigned for today</p>
          <p className="text-sm text-muted-foreground mt-1">Check back tomorrow for your daily tasks</p>
        </div>
      </Card>
    );
  }

  const completionPercentage = powerMoves.completion_percentage ?? 0;
  const completedCount = [
    powerMoves.move_1_completed,
    powerMoves.move_2_completed,
    powerMoves.move_3_completed,
  ].filter(Boolean).length;

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Today's Power Moves</h3>
        </div>
        <Badge className={cn(
          'text-sm font-bold px-3 py-1',
          completionPercentage === 100 ? 'bg-success text-white' :
          completionPercentage >= 67 ? 'bg-warning text-white' : 'bg-secondary text-muted-foreground'
        )}>
          {completedCount}/3
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {format(new Date(powerMoves.assigned_date), 'EEEE, MMMM d, yyyy')}
      </p>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Daily Progress</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all', completionPercentage === 100 ? 'bg-success' : completionPercentage >= 67 ? 'bg-warning' : 'bg-primary')}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <MoveItem
          moveNumber={1} description={powerMoves.move_1_description}
          completed={!!powerMoves.move_1_completed} completedAt={powerMoves.move_1_completed_at}
          points={powerMoves.move_1_points ?? 0} onComplete={() => onCompleteMove(1)} isLoading={isLoading}
        />
        <MoveItem
          moveNumber={2} description={powerMoves.move_2_description}
          completed={!!powerMoves.move_2_completed} completedAt={powerMoves.move_2_completed_at}
          points={powerMoves.move_2_points ?? 0} onComplete={() => onCompleteMove(2)} isLoading={isLoading}
        />
        <MoveItem
          moveNumber={3} description={powerMoves.move_3_description}
          completed={!!powerMoves.move_3_completed} completedAt={powerMoves.move_3_completed_at}
          points={powerMoves.move_3_points ?? 0} onComplete={() => onCompleteMove(3)} isLoading={isLoading}
        />
      </div>

      {completionPercentage === 100 && (
        <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20 text-center">
          <p className="text-success font-semibold">🎉 All moves completed!</p>
          <p className="text-sm text-muted-foreground mt-1">You earned {powerMoves.total_points} points today</p>
          {powerMoves.daily_grade && (
            <Badge className="mt-2 bg-success text-white font-bold">{powerMoves.daily_grade} Achievement</Badge>
          )}
        </div>
      )}

      {powerMoves.capacity_level && powerMoves.capacity_level !== 'normal' && (
        <div className="mt-3 p-3 rounded-lg bg-info/10 border border-info/20">
          <p className="text-xs text-foreground">
            <Calendar className="w-4 h-4 inline mr-2" />
            {powerMoves.capacity_level === 'high'
              ? 'Your calendar looks busy today. These moves are prioritized for you.'
              : 'Light schedule today. Great time to go above and beyond!'}
          </p>
        </div>
      )}
    </Card>
  );
}
