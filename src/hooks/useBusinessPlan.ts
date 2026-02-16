import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useBusinessPlan(year?: number) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const planYear = year || new Date().getFullYear();

  const plansQuery = useQuery({
    queryKey: ['business-plans', planYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('plan_year', planYear)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  const activePlan = plansQuery.data?.find(p => p.status === 'active');
  const draftPlan = plansQuery.data?.find(p => p.status === 'draft');

  const createPlan = useMutation({
    mutationFn: async (inputs: {
      income_goal: number;
      purchase_bps: number;
      refinance_bps: number;
      purchase_percentage: number;
      avg_loan_amount: number;
      pull_through_purchase: number;
      pull_through_refinance: number;
      conversion_rate_purchase: number;
      conversion_rate_refinance: number;
      leads_from_partners_percentage: number;
      leads_per_partner_per_month: number;
    }) => {
      const { data, error } = await supabase
        .from('business_plans')
        .insert({
          user_id: session!.user.id,
          plan_year: planYear,
          status: 'draft',
          ...inputs,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-plans'] });
      toast.success('Business plan created');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activatePlan = useMutation({
    mutationFn: async (planId: string) => {
      // Deactivate existing active plan
      if (activePlan) {
        await supabase
          .from('business_plans')
          .update({ status: 'revised' })
          .eq('id', activePlan.id);
      }
      const { error } = await supabase
        .from('business_plans')
        .update({ status: 'active' })
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-plans'] });
      toast.success('Plan activated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const performanceQuery = useQuery({
    queryKey: ['performance-metrics', planYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_performance_metrics', {
          p_user_id: session!.user.id,
          p_year: planYear,
        });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!session && !!activePlan,
  });

  return {
    plans: plansQuery.data || [],
    activePlan,
    draftPlan,
    isLoading: plansQuery.isLoading,
    createPlan,
    activatePlan,
    performance: performanceQuery.data,
    performanceLoading: performanceQuery.isLoading,
  };
}
