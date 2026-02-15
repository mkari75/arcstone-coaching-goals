import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Mail, RefreshCw, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useOutlookIntegration } from '@/hooks/useOutlookIntegration';
import { useAuth } from '@/hooks/useAuth';
import { OUTLOOK_AUTH_URL } from '@/integrations/outlook/outlookConfig';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function OutlookEmailConnect() {
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const { integration, isConnected, isLoading, disconnect, sync, isSyncing } =
    useOutlookIntegration(userId);
  const [autoSync, setAutoSync] = useState(integration?.auto_sync_enabled || false);

  const handleConnect = () => {
    window.location.href = OUTLOOK_AUTH_URL;
  };

  const handleAutoSyncToggle = async (enabled: boolean) => {
    if (!integration) return;
    await supabase
      .from('email_integrations')
      .update({ auto_sync_enabled: enabled })
      .eq('id', integration.id);
    setAutoSync(enabled);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Outlook Email
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Outlook Email
        </CardTitle>
        <CardDescription>
          Connect your Outlook account to sync emails and track communications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">Connected</span>
              <span className="text-sm text-muted-foreground">{integration?.email_address}</span>
              <Badge variant="default" className="ml-auto">
                Active
              </Badge>
            </div>

            {integration?.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                Last synced: {new Date(integration.last_sync_at).toLocaleString()}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-sync emails</p>
                <p className="text-xs text-muted-foreground">
                  Automatically sync every {integration?.sync_frequency_minutes || 15} minutes
                </p>
              </div>
              <Switch checked={autoSync} onCheckedChange={handleAutoSyncToggle} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => sync()} disabled={isSyncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={handleConnect}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect Outlook
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
