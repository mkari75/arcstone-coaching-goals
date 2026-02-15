import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OutlookEmailConnect } from '@/components/integrations/OutlookEmailConnect';
import { ApiKeysManager } from '@/components/integrations/ApiKeysManager';
import { WebhooksManager } from '@/components/integrations/WebhooksManager';
import { Plug, Mail, Key, Webhook } from 'lucide-react';

const IntegrationsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Plug className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Integrations</h1>
      </div>

      <Tabs defaultValue="email">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            Email & Calendar
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-1">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-1">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-4 space-y-4">
          <OutlookEmailConnect />
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <ApiKeysManager />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-4">
          <WebhooksManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsPage;
