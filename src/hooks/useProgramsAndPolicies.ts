import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// ============ PROGRAMS ============

export const usePrograms = (status?: string) => {
  return useQuery({
    queryKey: ['programs', status],
    queryFn: async () => {
      let query = supabase
        .from('programs')
        .select('*')
        .order('published_at', { ascending: false, nullsFirst: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useProgram = (id: string) => {
  return useQuery({
    queryKey: ['program', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateProgram = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (program: Omit<TablesInsert<'programs'>, 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('programs')
        .insert({ ...program, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast({ title: 'Success', description: 'Program created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'programs'> }) => {
      const { data, error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program', variables.id] });
      toast({ title: 'Success', description: 'Program updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// ============ POLICIES ============

export const usePolicies = (status?: string) => {
  return useQuery({
    queryKey: ['policies', status],
    queryFn: async () => {
      let query = supabase
        .from('policies')
        .select('*')
        .order('effective_date', { ascending: false, nullsFirst: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const usePolicy = (id: string) => {
  return useQuery({
    queryKey: ['policy', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreatePolicy = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (policy: Omit<TablesInsert<'policies'>, 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('policies')
        .insert({ ...policy, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast({ title: 'Success', description: 'Policy created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'policies'> }) => {
      const { data, error } = await supabase
        .from('policies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['policy', variables.id] });
      toast({ title: 'Success', description: 'Policy updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// ============ ACKNOWLEDGMENTS ============

export const usePendingAcknowledgments = () => {
  return useQuery({
    queryKey: ['pending-acknowledgments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .rpc('get_pending_acknowledgments', { p_user_id: user.id });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useAcknowledgeProgram = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      programId,
      signature,
      timeSpent,
    }: {
      programId: string;
      signature: string;
      timeSpent: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      };

      // Try upsert: insert if not exists, update if exists
      const { data, error } = await supabase
        .from('program_acknowledgments')
        .upsert({
          program_id: programId,
          user_id: user!.id,
          acknowledged_at: new Date().toISOString(),
          digital_signature: signature,
          device_info: deviceInfo,
          time_to_acknowledge: timeSpent,
        }, { onConflict: 'program_id,user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-acknowledgments'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast({ title: 'Program Acknowledged', description: 'Thank you for reviewing this program' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useAcknowledgePolicy = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      policyId,
      signature,
      quizScore,
      quizAttempts,
      timeSpent,
    }: {
      policyId: string;
      signature: string;
      quizScore?: number;
      quizAttempts?: number;
      timeSpent: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      };

      const { data, error } = await supabase
        .from('policy_acknowledgments')
        .upsert({
          policy_id: policyId,
          user_id: user!.id,
          acknowledged_at: new Date().toISOString(),
          digital_signature: signature,
          quiz_score: quizScore ?? null,
          quiz_attempts: quizAttempts ?? 0,
          quiz_passed: quizScore != null ? quizScore >= 80 : null,
          quiz_taken: quizScore != null,
          device_info: deviceInfo,
          time_to_acknowledge: timeSpent,
        }, { onConflict: 'policy_id,user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-acknowledgments'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast({ title: 'Policy Acknowledged', description: 'Your acknowledgment has been recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// ============ FILE UPLOAD ============

export const useUploadProgramDocument = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, programId }: { file: File; programId: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${programId}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('program-documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('program-documents')
        .getPublicUrl(fileName);

      return {
        name: file.name,
        url: urlData.publicUrl,
        type: fileExt as string,
        size: file.size,
      };
    },
    onError: (error: Error) => {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
    },
  });
};
