import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Flame, TrendingUp, Activity, Users, Diamond, Footprints, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAchievements, useUserAchievements } from '@/hooks/useAchievements';
import { useAuth } from '@/hooks/useAuth';

const iconMap: Record<string, any> = {
  Footprints, Flame, Award, TrendingUp, Activity, Users, Diamond,
};

export function AchievementBadges() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { data: allAchievements, isLoading: loadingAll } = useAchievements();
  const { data: userAchievements, isLoading: loadingUser } = useUserAchievements(userId);

  const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

  if (loadingAll || loadingUser) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-display font-bold text-foreground">Achievements</h2>
        <Badge variant="secondary">{earnedIds.size}/{allAchievements?.length || 0}</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {allAchievements?.map(achievement => {
          const earned = earnedIds.has(achievement.id);
          const Icon = iconMap[achievement.icon_name || ''] || Award;

          return (
            <Card
              key={achievement.id}
              className={cn(
                'transition-all',
                earned ? 'border-primary/30' : 'opacity-50 grayscale'
              )}
            >
              <CardContent className="p-4 text-center">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2',
                    earned ? 'bg-primary/15' : 'bg-muted'
                  )}
                  style={earned ? { backgroundColor: `${achievement.color}20` } : undefined}
                >
                  {earned ? (
                    <Icon className="w-6 h-6" style={{ color: achievement.color || undefined }} />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <p className="font-semibold text-xs text-foreground">{achievement.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{achievement.description}</p>
                {earned && (
                  <Badge className="mt-2 text-xs" variant="secondary">+{achievement.points_bonus} pts</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
