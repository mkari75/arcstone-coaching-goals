import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useContactsList(userId: string | undefined, filters?: { search?: string; contactType?: string }) {
  return useQuery({
    queryKey: ['contacts-list', userId, filters],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId!)
        .order('name');

      if (filters?.contactType) query = query.eq('contact_type', filters.contactType);
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useContact(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').eq('id', contactId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contact: TablesInsert<'contacts'>) => {
      const { data, error } = await supabase.from('contacts').insert(contact).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts-list'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'contacts'> }) => {
      const { data, error } = await supabase.from('contacts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['contacts-list'] });
      queryClient.invalidateQueries({ queryKey: ['contact', vars.id] });
      toast.success('Contact updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts-list'] });
      toast.success('Contact deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useContactActivities(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-activities', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('contact_id', contactId!)
        .order('completed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });
}
