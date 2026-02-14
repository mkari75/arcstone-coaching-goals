import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sun, Target, Calendar, CheckCircle, Sparkles, ArrowRight, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type DailyPowerMove = Tables<'daily_power_moves'>;

interface MorningKickoffProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  powerMoves: DailyPowerMove | null;
  currentStreak: number;
  yesterdayCompletion: number;
  upcomingMeetings?: number;
}

export function MorningKickoff({ isOpen, onClose, userName, powerMoves, currentStreak, yesterdayCompletion, upcomingMeetings = 0 }: MorningKickoffProps) {
  const [step, setStep] = useState<'welcome' | 'moves' | 'ready'>('welcome');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const renderWelcomeStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center mx-auto">
        <Sun className="w-10 h-10 text-white" />
      </div>
      <div>
        <h3 className="text-2xl font-display font-bold text-foreground">{getGreeting()}, {userName}!</h3>
        <p className="text-muted-foreground mt-2">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-display font-bold text-success">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{upcomingMeetings}</p>
          <p className="text-xs text-muted-foreground">Upcoming Meetings</p>
        </Card>
      </div>

      <Button onClick={() => setStep('moves')} className="w-full" size="lg">
        View Today's Power Moves
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  const renderMovesStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Target className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-bold text-foreground">Your 3 Power Moves</h3>
          <p className="text-xs text-muted-foreground">Complete these to maintain your streak</p>
        </div>
      </div>

      {powerMoves ? (
        <div className="space-y-3">
          {[1, 2, 3].map((num) => {
            const desc = powerMoves[`move_${num}_description` as keyof DailyPowerMove] as string;
            const pts = (powerMoves[`move_${num}_points` as keyof DailyPowerMove] as number) ?? 0;
            return (
              <Card key={num} className="p-4 border-2 border-secondary">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    {num}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{desc}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />{pts} points
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4">No moves assigned yet. Check back later!</p>
      )}

      <div className="flex gap-3">
        <Button onClick={() => setStep('welcome')} variant="outline" className="flex-1">Back</Button>
        <Button onClick={() => setStep('ready')} className="flex-1">Next</Button>
      </div>
    </div>
  );

  const renderReadyStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
        <Coffee className="w-12 h-12 text-white" />
      </div>
      <div>
        <h3 className="text-2xl font-display font-bold text-foreground">You're All Set!</h3>
        <p className="text-muted-foreground mt-2">Your dashboard is ready. Track your progress throughout the day and complete your Power Moves.</p>
      </div>
      <div className="p-3 rounded-lg bg-info/10 border border-info/20">
        <p className="text-sm text-foreground">💡 Pro Tip: Complete your first move before 10 AM to build momentum!</p>
      </div>
      <Button onClick={onClose} className="w-full" size="lg">
        Go to Dashboard
        <CheckCircle className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Morning Kickoff</DialogTitle>
          <DialogDescription>Start your day with your coaching overview</DialogDescription>
        </DialogHeader>
        {step === 'welcome' && renderWelcomeStep()}
        {step === 'moves' && renderMovesStep()}
        {step === 'ready' && renderReadyStep()}
      </DialogContent>
    </Dialog>
  );
}
