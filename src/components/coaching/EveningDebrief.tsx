import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Moon, Star, TrendingUp, CheckCircle2, XCircle, Award, Lightbulb, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type DailyPowerMove = Tables<'daily_power_moves'>;

interface EveningDebriefProps {
  isOpen: boolean;
  onClose: () => void;
  powerMoves: DailyPowerMove | null;
  todayPoints: number;
  activitiesLogged: number;
  onSaveReflection?: (reflection: string) => void;
}

export function EveningDebrief({ isOpen, onClose, powerMoves, todayPoints, activitiesLogged, onSaveReflection }: EveningDebriefProps) {
  const [reflection, setReflection] = useState('');
  const [step, setStep] = useState<'summary' | 'reflection' | 'preview'>('summary');

  const completionPercentage = powerMoves?.completion_percentage ?? 0;
  const completedCount = powerMoves
    ? [powerMoves.move_1_completed, powerMoves.move_2_completed, powerMoves.move_3_completed].filter(Boolean).length
    : 0;

  const getPerformanceMessage = () => {
    if (completionPercentage === 100) return { icon: Award, title: 'Perfect Day! 🎉', message: 'You completed all your Power Moves. Outstanding work!', color: 'text-success', bgColor: 'bg-success/5' };
    if (completionPercentage >= 67) return { icon: TrendingUp, title: 'Strong Performance! 💪', message: 'You completed most of your moves. Great momentum!', color: 'text-warning', bgColor: 'bg-warning/5' };
    if (completionPercentage >= 33) return { icon: Star, title: 'Good Start 👍', message: "You made progress today. Tomorrow, let's complete all three!", color: 'text-info', bgColor: 'bg-info/5' };
    return { icon: Calendar, title: 'Tomorrow is a New Day 🌅', message: "Every champion has off days. Let's reset and crush it tomorrow!", color: 'text-tertiary', bgColor: 'bg-muted' };
  };

  const performance = getPerformanceMessage();
  const PerformanceIcon = performance.icon;

  const handleSaveAndClose = () => {
    if (reflection.trim() && onSaveReflection) onSaveReflection(reflection);
    setStep('summary');
    setReflection('');
    onClose();
  };

  const renderSummaryStep = () => (
    <div className="space-y-4">
      <Card className={cn('p-6', performance.bgColor)}>
        <div className="text-center">
          <PerformanceIcon className={cn('w-10 h-10 mx-auto mb-2', performance.color)} />
          <h3 className={cn('text-xl font-display font-bold', performance.color)}>{performance.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{performance.message}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-foreground">{completedCount}/3</p>
            <p className="text-xs text-muted-foreground">Moves Done</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-foreground">{todayPoints}</p>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-foreground">{activitiesLogged}</p>
            <p className="text-xs text-muted-foreground">Activities</p>
          </div>
        </div>
      </Card>

      {powerMoves && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Move Completion</p>
          {[1, 2, 3].map((num) => {
            const desc = powerMoves[`move_${num}_description` as keyof DailyPowerMove] as string;
            const done = powerMoves[`move_${num}_completed` as keyof DailyPowerMove] as boolean;
            return (
              <div key={num} className="flex items-center gap-2">
                {done ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <XCircle className="w-5 h-5 text-tertiary shrink-0" />}
                <span className={cn('text-sm', done ? 'text-foreground' : 'text-muted-foreground')}>{desc}</span>
              </div>
            );
          })}
        </div>
      )}

      <Button onClick={() => setStep('reflection')} className="w-full">Continue to Reflection</Button>
    </div>
  );

  const renderReflectionStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-warning" />
        </div>
        <div>
          <h3 className="font-display font-bold text-foreground">Daily Reflection</h3>
          <p className="text-xs text-muted-foreground">What did you learn today?</p>
        </div>
      </div>
      <Textarea
        placeholder="Reflect on your day (optional)"
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        rows={6}
        className="resize-none"
      />
      <p className="text-xs text-muted-foreground">💡 Tip: Daily reflection helps you identify patterns and improve over time.</p>
      <div className="flex gap-3">
        <Button onClick={() => setStep('summary')} variant="outline" className="flex-1">Back</Button>
        <Button onClick={() => setStep('preview')} className="flex-1">Next</Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
        <Star className="w-8 h-8 text-white" />
      </div>
      <div>
        <h3 className="text-xl font-display font-bold text-foreground">Ready for Tomorrow?</h3>
        <p className="text-sm text-muted-foreground mt-2">Your new Power Moves will be ready at 7:00 AM tomorrow.</p>
      </div>
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-sm text-foreground">🎯 Tomorrow's Goal: Complete all 3 moves by 5 PM</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 text-center">
          <p className="text-sm font-medium text-muted-foreground">Tomorrow</p>
          <p className="font-display font-bold text-foreground">3 New Moves</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-sm font-medium text-muted-foreground">Potential</p>
          <p className="font-display font-bold text-foreground">75 Points</p>
        </Card>
      </div>
      <Button onClick={handleSaveAndClose} className="w-full" size="lg">Done</Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSaveAndClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            <DialogTitle className="font-display">Day Complete</DialogTitle>
          </div>
          <DialogDescription>Let's review your performance</DialogDescription>
        </DialogHeader>
        {step === 'summary' && renderSummaryStep()}
        {step === 'reflection' && renderReflectionStep()}
        {step === 'preview' && renderPreviewStep()}
      </DialogContent>
    </Dialog>
  );
}
