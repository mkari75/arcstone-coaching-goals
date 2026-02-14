import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Send, Trophy, Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCelebrationFeed, useLikeCelebration, useAddComment } from '@/hooks/useCelebrationFeed';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const celebrationIcons: Record<string, any> = {
  achievement: Trophy,
  streak: Flame,
  tier_up: Sparkles,
  milestone: Trophy,
};

export function CelebrationFeed() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { data: celebrations, isLoading } = useCelebrationFeed();
  const likeMutation = useLikeCelebration();
  const commentMutation = useAddComment();
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!celebrations?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No celebrations yet. Achievements will appear here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-display font-bold text-foreground">Team Celebrations</h2>
      </div>

      {celebrations.map((c: any) => {
        const Icon = celebrationIcons[c.celebration_type] || Trophy;
        const initials = c.profile?.full_name
          ?.split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase() || '?';

        return (
          <Card key={c.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground">
                      {c.profile?.full_name || 'Team Member'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <Icon className="w-4 h-4 text-primary" />
                    <p className="font-semibold text-sm text-foreground">{c.title}</p>
                  </div>

                  {c.description && (
                    <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => userId && likeMutation.mutate({ celebrationId: c.id, userId })}
                    >
                      <Heart className={cn('w-4 h-4 mr-1')} />
                      {c.like_count || 0}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setShowComments(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {c.comment_count || 0}
                    </Button>
                  </div>

                  {showComments[c.id] && (
                    <div className="mt-3 flex gap-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={commentText[c.id] || ''}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [c.id]: e.target.value }))}
                        className="min-h-[60px] text-sm"
                      />
                      <Button
                        size="icon"
                        disabled={!commentText[c.id]?.trim()}
                        onClick={() => {
                          if (userId && commentText[c.id]?.trim()) {
                            commentMutation.mutate({
                              celebrationId: c.id,
                              userId,
                              comment: commentText[c.id].trim(),
                            });
                            setCommentText(prev => ({ ...prev, [c.id]: '' }));
                          }
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
