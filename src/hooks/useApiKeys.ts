import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useApiKeys(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const createKey = useMutation({
    mutationFn: async (params: { name: string; scopes: string[] }) => {
      // Generate a random API key
      const rawKey = `ak_${crypto.randomUUID().replace(/-/g, '')}`;
      const keyPrefix = rawKey.substring(0, 11) + '...';

      // Hash the key
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.from('api_keys').insert({
        user_id: userId,
        name: params.name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: params.scopes,
      });
      if (error) throw error;
      return rawKey; // Return raw key only once for user to copy
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', userId] });
      toast({ title: 'API Key Created', description: 'Copy it now — it won\'t be shown again.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', userId] });
      toast({ title: 'Key Revoked' });
    },
  });

  const deleteKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase.from('api_keys').delete().eq('id', keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', userId] });
      toast({ title: 'Key Deleted' });
    },
  });

  return { apiKeys, isLoading, createKey, revokeKey, deleteKey };
}

export function useWebhooks(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const createWebhook = useMutation({
    mutationFn: async (params: { name: string; url: string; events: string[] }) => {
      const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;
      const { error } = await supabase.from('webhooks').insert({
        user_id: userId,
        name: params.name,
        url: params.url,
        events: params.events,
        secret,
      });
      if (error) throw error;
      return secret;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', userId] });
      toast({ title: 'Webhook Created' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleWebhook = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', userId] });
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', userId] });
      toast({ title: 'Webhook Deleted' });
    },
  });

  return { webhooks, isLoading, createWebhook, toggleWebhook, deleteWebhook };
}
