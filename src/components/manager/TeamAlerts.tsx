import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamAlerts, useResolveAlert, useGenerateAlerts } from '@/hooks/useTeamAlerts';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const alertStyles: Record<string, { icon: any; color: string; bg: string }> = {
  critical: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export function TeamAlerts({ limit }: { limit?: number }) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const { data: alerts, isLoading } = useTeamAlerts(false);
  const resolveAlertMutation = useResolveAlert();
  const generateAlertsMutation = useGenerateAlerts();

  const displayAlerts = limit ? alerts?.slice(0, limit) : alerts;

  const handleResolve = async () => {
    if (!selectedAlert || !userId) return;
    await resolveAlertMutation.mutateAsync({
      alertId: selectedAlert.id,
      resolvedBy: userId,
      resolutionNote: resolutionNote || undefined,
    });
    setSelectedAlert(null);
    setResolutionNote('');
  };

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Team Alerts
              {alerts?.length ? (
                <Badge variant="destructive" className="text-xs">{alerts.length}</Badge>
              ) : null}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateAlertsMutation.mutate()}
              disabled={generateAlertsMutation.isPending}
            >
              <RefreshCw className={cn('w-4 h-4 mr-1', generateAlertsMutation.isPending && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {!displayAlerts?.length ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">No active alerts. Your team is doing great!</p>
            </div>
          ) : (
            displayAlerts.map(alert => {
              const style = alertStyles[alert.severity] || alertStyles.info;
              const Icon = style.icon;
              const initials = (alert as any).profile?.full_name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase() || '?';

              return (
                <div key={alert.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', style.bg)}>
                  <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', style.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {(alert as any).profile?.full_name || 'Unknown'} · {formatDistanceToNow(new Date(alert.triggered_at!), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedAlert(alert)}>
                    Resolve
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Resolve dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedAlert.title}</p>
                <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
              </div>
              <Textarea
                placeholder="Resolution note (optional)..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={resolveAlertMutation.isPending}>
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
