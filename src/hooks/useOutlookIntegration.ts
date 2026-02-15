import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OutlookClient } from '@/integrations/outlook/outlookClient';
import { useToast } from '@/hooks/use-toast';

export function useOutlookIntegration(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: integration, isLoading } = useQuery({
    queryKey: ['outlook-integration', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'outlook')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId,
  });

  const connectMutation = useMutation({
    mutationFn: async (authCode: string) => {
      const { data, error } = await supabase.functions.invoke(
        'outlook-connect',
        { body: { code: authCode, userId } }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlook-integration', userId] });
      toast({ title: 'Success', description: 'Outlook connected successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Connection failed', description: error.message, variant: 'destructive' });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!integration) return;
      const { error } = await supabase
        .from('email_integrations')
        .delete()
        .eq('id', integration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlook-integration', userId] });
      toast({ title: 'Disconnected', description: 'Outlook has been disconnected' });
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!integration) throw new Error('No integration found');

      const { data: syncLog } = await supabase
        .from('email_sync_log')
        .insert({ integration_id: integration.id, status: 'in_progress' })
        .select()
        .single();

      try {
        const client = new OutlookClient(userId);
        const messages = await client.fetchMessages(50);

        const emailActivities = messages.map(msg => ({
          user_id: userId,
          integration_id: integration.id,
          email_id: msg.id,
          conversation_id: msg.conversationId,
          subject: msg.subject,
          from_email: msg.from.emailAddress.address,
          from_name: msg.from.emailAddress.name,
          to_emails: msg.toRecipients.map((r: any) => r.emailAddress.address),
          cc_emails: msg.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
          body_content: msg.body.content,
          body_preview: msg.bodyPreview,
          sent_at: msg.sentDateTime,
          received_at: msg.receivedDateTime,
          is_read: msg.isRead,
          has_attachments: msg.hasAttachments,
          importance: msg.importance,
          direction: msg.from.emailAddress.address === integration.email_address ? 'outbound' : 'inbound'
        }));

        const { error: upsertError } = await supabase
          .from('email_activities')
          .upsert(emailActivities, { onConflict: 'user_id,email_id', ignoreDuplicates: false });
        if (upsertError) throw upsertError;

        await supabase
          .from('email_sync_log')
          .update({
            status: 'completed',
            sync_completed_at: new Date().toISOString(),
            messages_fetched: messages.length,
            messages_processed: emailActivities.length
          })
          .eq('id', syncLog!.id);

        await supabase
          .from('email_integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', integration.id);

        return { synced: emailActivities.length };
      } catch (error) {
        await supabase
          .from('email_sync_log')
          .update({
            status: 'failed',
            sync_completed_at: new Date().toISOString(),
            error_message: (error as Error).message
          })
          .eq('id', syncLog!.id);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-activities', userId] });
      toast({ title: 'Sync complete', description: `${data.synced} emails synced` });
    },
    onError: (error: any) => {
      toast({ title: 'Sync failed', description: error.message, variant: 'destructive' });
    }
  });

  return {
    integration,
    isConnected: !!integration?.is_active,
    isLoading,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending
  };
}

export function useEmailActivities(userId: string) {
  return useQuery({
    queryKey: ['email-activities', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_activities')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useSendEmail(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      contactId?: string;
    }) => {
      const client = new OutlookClient(userId);
      await client.sendEmail(params);

      if (params.contactId) {
        const { data: integ } = await supabase
          .from('email_integrations')
          .select('email_address')
          .eq('user_id', userId)
          .single();

        await supabase.from('email_activities').insert({
          user_id: userId,
          contact_id: params.contactId,
          email_id: `sent-${Date.now()}`,
          subject: params.subject,
          from_email: integ?.email_address || '',
          to_emails: params.to,
          cc_emails: params.cc || [],
          body_content: params.body,
          sent_at: new Date().toISOString(),
          direction: 'outbound'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-activities', userId] });
      toast({ title: 'Email sent', description: 'Your email has been sent successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Send failed', description: error.message, variant: 'destructive' });
    }
  });
}
