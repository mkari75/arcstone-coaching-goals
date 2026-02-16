import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  BusinessPlan, ActualProduction, PlanRevision, AuditEntry, ChartConfig,
  PerformanceMetrics,
  mapBusinessPlan, mapActualProduction, mapPlanRevision, mapAuditEntry, mapChartConfig,
} from '@/lib/types/goals';

// ========== BUSINESS PLANS ==========
export function useBusinessPlans(userId?: string) {
  const { session } = useAuth();
  const targetUserId = userId || session?.user?.id;

  return useQuery({
    queryKey: ['business-plans', targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('user_id', targetUserId!)
        .order('plan_year', { ascending: false });
      if (error) throw error;
      return data.map(mapBusinessPlan);
    },
    enabled: !!targetUserId,
  });
}

export function useActivePlan(userId?: string, year?: number) {
  const { session } = useAuth();
  const targetUserId = userId || session?.user?.id;
  const targetYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ['active-plan', targetUserId, targetYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('user_id', targetUserId!)
        .eq('plan_year', targetYear)
        .eq('status', 'active')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapBusinessPlan(data) : null;
    },
    enabled: !!targetUserId,
  });
}

export function useSaveBusinessPlan() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (plan: Partial<BusinessPlan>) => {
      const planYear = plan.planYear || new Date().getFullYear();
      const userId = session!.user.id;

      // Check if active plan exists for this year
      const { data: existing } = await supabase
        .from('business_plans')
        .select('id')
        .eq('user_id', userId)
        .eq('plan_year', planYear)
        .eq('status', 'active')
        .single();

      const planData = {
        income_goal: plan.incomeGoal,
        purchase_bps: plan.purchaseBps,
        refinance_bps: plan.refinanceBps,
        purchase_percentage: plan.purchasePercentage,
        avg_loan_amount: plan.avgLoanAmount,
        pull_through_purchase: plan.pullThroughPurchase,
        pull_through_refinance: plan.pullThroughRefinance,
        conversion_rate_purchase: plan.conversionRatePurchase,
        conversion_rate_refinance: plan.conversionRateRefinance,
        leads_from_partners_percentage: plan.leadsFromPartnersPercentage,
        leads_per_partner_per_month: plan.leadsPerPartnerPerMonth,
      };

      if (existing) {
        const { data, error } = await supabase
          .from('business_plans')
          .update(planData)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return mapBusinessPlan(data);
      } else {
        const { data, error } = await supabase
          .from('business_plans')
          .insert({
            user_id: userId,
            plan_year: planYear,
            status: 'active',
            ...planData,
          })
          .select()
          .single();
        if (error) throw error;
        return mapBusinessPlan(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-plans'] });
      queryClient.invalidateQueries({ queryKey: ['active-plan'] });
      queryClient.invalidateQueries({ queryKey: ['performance-metrics'] });
      toast.success('Business plan saved successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ========== ACTUAL PRODUCTION ==========
export function useActualProduction(userId?: string, year?: number) {
  const { session } = useAuth();
  const targetUserId = userId ?? session?.user?.id;
  const targetYear = year ?? new Date().getFullYear();

  return useQuery({
    queryKey: ['actual-production', targetUserId, targetYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actual_production')
        .select('*')
        .eq('user_id', targetUserId!)
        .eq('year', targetYear)
        .order('close_date', { ascending: false });
      if (error) throw error;
      return data.map((r: any) => mapActualProduction(r));
    },
    enabled: !!targetUserId,
  });
}

export function useAddLoan() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (loan: {
      borrowerFullName: string;
      loanNumber: string;
      loanAmount: number;
      loBps: number;
      loCompensation: number;
      transactionType: string;
      loanType: string;
      occupancy: string;
      loanStatus?: string;
      lienPosition?: string;
      closeDate: string;
    }) => {
      const closeDate = new Date(loan.closeDate);
      const { data, error } = await supabase
        .from('actual_production')
        .insert({
          user_id: session!.user.id,
          borrower_full_name: loan.borrowerFullName,
          loan_number: loan.loanNumber,
          loan_amount: loan.loanAmount,
          lo_bps: loan.loBps,
          lo_compensation: loan.loCompensation,
          transaction_type: loan.transactionType,
          loan_type: loan.loanType as any,
          occupancy: loan.occupancy as any,
          loan_status: loan.loanStatus || 'originated',
          lien_position: loan.lienPosition,
          close_date: loan.closeDate,
          year: closeDate.getFullYear(),
        })
        .select()
        .single();
      if (error) throw error;
      return mapActualProduction(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actual-production'] });
      queryClient.invalidateQueries({ queryKey: ['performance-metrics'] });
      toast.success('Loan added successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanId: string) => {
      const { error } = await supabase.from('actual_production').delete().eq('id', loanId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actual-production'] });
      queryClient.invalidateQueries({ queryKey: ['performance-metrics'] });
      toast.success('Loan deleted successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ========== PERFORMANCE METRICS ==========
export function usePerformanceMetrics(userId?: string, year?: number) {
  const { session } = useAuth();
  const targetUserId = userId ?? session?.user?.id;
  const targetYear = year ?? new Date().getFullYear();

  return useQuery({
    queryKey: ['performance-metrics', targetUserId, targetYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_performance_metrics', {
          p_user_id: targetUserId!,
          p_year: targetYear,
        });
      if (error) throw error;
      const row = data?.[0];
      if (!row) return null;
      return {
        ytdVolume: parseFloat(String(row.ytd_volume ?? 0)),
        ytdUnits: parseInt(String(row.ytd_units ?? 0)),
        ytdProfit: parseFloat(String(row.ytd_profit ?? 0)),
        purchaseMix: parseFloat(String(row.purchase_mix ?? 0)),
        volumeGoal: parseFloat(String(row.volume_goal ?? 0)),
        unitsGoal: parseInt(String(row.units_goal ?? 0)),
        incomeGoal: parseFloat(String(row.income_goal ?? 0)),
        volumeAchievement: parseFloat(String(row.volume_achievement ?? 0)),
        unitsAchievement: parseFloat(String(row.units_achievement ?? 0)),
        profitAchievement: parseFloat(String(row.profit_achievement ?? 0)),
      } as PerformanceMetrics;
    },
    enabled: !!targetUserId,
  });
}

// ========== PLAN REVISIONS ==========
export function usePlanRevisions(userId?: string) {
  const { session } = useAuth();
  const targetUserId = userId || session?.user?.id;

  return useQuery({
    queryKey: ['plan-revisions', targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_revisions')
        .select('*')
        .eq('requested_by', targetUserId!)
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return data.map((r: any) => mapPlanRevision(r));
    },
    enabled: !!targetUserId,
  });
}

export function useCreateRevision() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (revision: {
      originalPlanId: string;
      loJustification: string;
      effectiveDate: string;
      fieldToChange: string;
      currentValue: number;
      requestedValue: number;
    }) => {
      const { data, error } = await supabase
        .from('plan_revisions')
        .insert({
          original_plan_id: revision.originalPlanId,
          requested_by: session!.user.id,
          requested_by_name: session!.user.email || 'Unknown',
          lo_justification: revision.loJustification,
          effective_date: revision.effectiveDate,
          field_to_change: revision.fieldToChange,
          current_value: revision.currentValue,
          requested_value: revision.requestedValue,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return mapPlanRevision(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-revisions'] });
      toast.success('Revision request submitted');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ========== AUDIT ENTRIES ==========
export function useAuditEntries() {
  return useQuery({
    queryKey: ['audit-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_entries')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data.map((r: any) => mapAuditEntry(r));
    },
  });
}

// ========== CHART CONFIGS ==========
export function useChartConfigs() {
  return useQuery({
    queryKey: ['chart-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_configs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data.map((r: any) => mapChartConfig(r));
    },
  });
}

// ========== MANAGER: ALL BUSINESS PLANS ==========
export function useAllBusinessPlans(year?: number) {
  const targetYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ['all-business-plans', targetYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('plan_year', targetYear)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(mapBusinessPlan);
    },
  });
}

// ========== MANAGER: PENDING REVISIONS ==========
export function usePendingRevisions() {
  return useQuery({
    queryKey: ['pending-revisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_revisions')
        .select('*')
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return data.map((r: any) => mapPlanRevision(r));
    },
  });
}

// ========== MANAGER: APPROVE/REJECT REVISION ==========
export function useApproveRevision() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ revisionId, decision, managerNotes }: {
      revisionId: string;
      decision: 'approved' | 'rejected';
      managerNotes: string;
    }) => {
      const { data, error } = await supabase
        .from('plan_revisions')
        .update({
          status: decision,
          reviewed_by: session!.user.id,
          reviewed_at: new Date().toISOString(),
          manager_notes: managerNotes,
        })
        .eq('id', revisionId)
        .select()
        .single();
      if (error) throw error;

      // If approved, update the business plan field
      if (decision === 'approved') {
        const revision = mapPlanRevision(data as any);
        const fieldMap: Record<string, string> = {
          incomeGoal: 'income_goal',
          purchaseBps: 'purchase_bps',
          refinanceBps: 'refinance_bps',
          purchasePercentage: 'purchase_percentage',
          avgLoanAmount: 'avg_loan_amount',
          pullThroughPurchase: 'pull_through_purchase',
          pullThroughRefinance: 'pull_through_refinance',
          conversionRatePurchase: 'conversion_rate_purchase',
          conversionRateRefinance: 'conversion_rate_refinance',
          leadsFromPartnersPercentage: 'leads_from_partners_percentage',
          leadsPerPartnerPerMonth: 'leads_per_partner_per_month',
        };
        const dbField = fieldMap[revision.fieldToChange];
        if (dbField) {
          const { error: updateError } = await supabase
            .from('business_plans')
            .update({ [dbField]: revision.requestedValue })
            .eq('id', revision.originalPlanId);
          if (updateError) throw updateError;
        }
      }

      return mapPlanRevision(data as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-revisions'] });
      queryClient.invalidateQueries({ queryKey: ['plan-revisions'] });
      queryClient.invalidateQueries({ queryKey: ['business-plans'] });
      queryClient.invalidateQueries({ queryKey: ['all-business-plans'] });
      queryClient.invalidateQueries({ queryKey: ['active-plan'] });
      toast.success(`Revision ${variables.decision} successfully`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
