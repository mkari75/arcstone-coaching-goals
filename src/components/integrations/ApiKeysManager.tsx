import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Key, Plus, Trash2, Copy, Ban } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const AVAILABLE_SCOPES = [
  'read:contacts', 'write:contacts',
  'read:activities', 'write:activities',
  'read:leaderboard',
  'read:programs',
  'read:policies',
];

export function ApiKeysManager() {
  const { session } = useAuth();
  const { apiKeys, isLoading, createKey, revokeKey, deleteKey } = useApiKeys(session?.user?.id || '');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleCreate = async () => {
    const key = await createKey.mutateAsync({ name, scopes });
    setNewKey(key);
    setName('');
    setScopes([]);
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast({ title: 'Copied', description: 'API key copied to clipboard' });
    }
  };

  const toggleScope = (scope: string) => {
    setScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>Manage API keys for external integrations</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setNewKey(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Create Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>Generate a new API key with specific permissions</DialogDescription>
            </DialogHeader>
            {newKey ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Copy this key now — it won't be shown again.</p>
                <div className="flex gap-2">
                  <Input readOnly value={newKey} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={copyKey}><Copy className="h-4 w-4" /></Button>
                </div>
                <Button className="w-full" onClick={() => { setOpen(false); setNewKey(null); }}>Done</Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label>Key Name</Label>
                    <Input placeholder="e.g. CRM Integration" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Scopes</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_SCOPES.map(scope => (
                        <div key={scope} className="flex items-center gap-2">
                          <Checkbox
                            id={scope}
                            checked={scopes.includes(scope)}
                            onCheckedChange={() => toggleScope(scope)}
                          />
                          <label htmlFor={scope} className="text-sm">{scope}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={!name || scopes.length === 0 || createKey.isPending}>
                    {createKey.isPending ? 'Creating...' : 'Generate Key'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !apiKeys?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No API keys created yet.</p>
        ) : (
          <div className="space-y-3">
            {apiKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{key.name}</p>
                    <Badge variant={key.is_active ? 'default' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Revoked'}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">{key.key_prefix}</p>
                  <p className="text-xs text-muted-foreground">
                    Scopes: {key.scopes.join(', ')}
                  </p>
                </div>
                <div className="flex gap-1">
                  {key.is_active && (
                    <Button size="icon" variant="ghost" onClick={() => revokeKey.mutate(key.id)} title="Revoke">
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => deleteKey.mutate(key.id)} title="Delete">
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
