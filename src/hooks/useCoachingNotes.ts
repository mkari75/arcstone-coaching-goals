import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useCoachingNotes(loanOfficerId: string) {
  return useQuery({
    queryKey: ['coaching-notes', loanOfficerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaching_notes')
        .select('*')
        .eq('loan_officer_id', loanOfficerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!loanOfficerId,
  });
}

export function useCreateCoachingNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (note: {
      coach_id: string;
      loan_officer_id: string;
      note_type: string;
      subject?: string;
      content: string;
      action_items?: any[];
      requires_follow_up?: boolean;
      follow_up_date?: string;
      is_private?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('coaching_notes')
        .insert([note])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-notes'] });
      toast({ title: 'Note saved', description: 'Coaching note has been recorded.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error saving note', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCoachingNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('coaching_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-notes'] });
      toast({ title: 'Note updated' });
    },
  });
}

export function useDeleteCoachingNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('coaching_notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-notes'] });
      toast({ title: 'Note deleted' });
    },
  });
}
