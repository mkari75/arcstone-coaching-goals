import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Webhook, Plus, Trash2 } from 'lucide-react';
import { useWebhooks } from '@/hooks/useApiKeys';
import { useAuth } from '@/hooks/useAuth';

const AVAILABLE_EVENTS = [
  'contact.created', 'contact.updated', 'contact.deleted',
  'activity.created', 'activity.completed',
  'achievement.earned',
  'power_move.completed',
];

export function WebhooksManager() {
  const { session } = useAuth();
  const { webhooks, isLoading, createWebhook, toggleWebhook, deleteWebhook } = useWebhooks(session?.user?.id || '');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);

  const handleCreate = async () => {
    await createWebhook.mutateAsync({ name, url, events });
    setName(''); setUrl(''); setEvents([]);
    setOpen(false);
  };

  const toggleEvent = (event: string) => {
    setEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>Send real-time notifications to external services</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Webhook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>Configure a new webhook endpoint</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input placeholder="e.g. Slack Notifications" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Endpoint URL</Label>
                <Input placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_EVENTS.map(event => (
                    <div key={event} className="flex items-center gap-2">
                      <Checkbox
                        id={event}
                        checked={events.includes(event)}
                        onCheckedChange={() => toggleEvent(event)}
                      />
                      <label htmlFor={event} className="text-xs">{event}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!name || !url || events.length === 0 || createWebhook.isPending}>
                {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !webhooks?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No webhooks configured yet.</p>
        ) : (
          <div className="space-y-3">
            {webhooks.map(wh => (
              <div key={wh.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{wh.name}</p>
                    <Badge variant={wh.is_active ? 'default' : 'secondary'}>
                      {wh.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{wh.url}</p>
                  <p className="text-xs text-muted-foreground">
                    Events: {wh.events.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={wh.is_active ?? false}
                    onCheckedChange={(active) => toggleWebhook.mutate({ id: wh.id, is_active: active })}
                  />
                  <Button size="icon" variant="ghost" onClick={() => deleteWebhook.mutate(wh.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
