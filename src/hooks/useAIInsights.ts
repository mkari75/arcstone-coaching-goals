import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { aiCoachingService } from '@/services/aiCoachingService';
import { useToast } from '@/hooks/use-toast';

export function useAIInsights(userId: string) {
  return useQuery({
    queryKey: ['ai-insights', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_coaching_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('is_acknowledged', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useAIRecommendations(userId: string) {
  return useQuery({
    queryKey: ['ai-recommendations', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .eq('is_dismissed', false)
        .order('confidence_score', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useGenerateInsights(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      return await aiCoachingService.analyzeUserPerformance(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights', userId] });
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations', userId] });
      toast({ title: 'Insights generated', description: 'New AI coaching insights are available' });
    },
    onError: (error: any) => {
      toast({ title: 'Generation failed', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAcknowledgeInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('ai_coaching_insights')
        .update({ is_acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq('id', insightId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    },
  });
}

export function useCompleteRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recommendationId: string) => {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', recommendationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recommendationId: string) => {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', recommendationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
}
