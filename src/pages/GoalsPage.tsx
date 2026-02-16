import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, DollarSign, Users, BarChart3, CheckCircle2 } from 'lucide-react';
import { useBusinessPlan } from '@/hooks/useBusinessPlan';
import { calculateBusinessPlan, formatCurrency, formatCurrencyShort, formatPercentage, calculateAchievement } from '@/lib/calculations';

const GoalsPage = () => {
  const currentYear = new Date().getFullYear();
  const { plans, activePlan, createPlan, activatePlan, performance, isLoading } = useBusinessPlan(currentYear);

  const [formData, setFormData] = useState({
    income_goal: 200000,
    purchase_bps: 125,
    refinance_bps: 100,
    purchase_percentage: 0.7,
    avg_loan_amount: 350000,
    pull_through_purchase: 0.8,
    pull_through_refinance: 0.75,
    conversion_rate_purchase: 0.5,
    conversion_rate_refinance: 0.45,
    leads_from_partners_percentage: 0.2,
    leads_per_partner_per_month: 1,
  });

  const calculatedGoals = useMemo(() => {
    return calculateBusinessPlan({
      incomeGoal: formData.income_goal,
      purchaseBps: formData.purchase_bps,
      refinanceBps: formData.refinance_bps,
      purchasePercentage: formData.purchase_percentage,
      avgLoanAmount: formData.avg_loan_amount,
      pullThroughPurchase: formData.pull_through_purchase,
      pullThroughRefinance: formData.pull_through_refinance,
      conversionRatePurchase: formData.conversion_rate_purchase,
      conversionRateRefinance: formData.conversion_rate_refinance,
      leadsFromPartnersPercentage: formData.leads_from_partners_percentage,
      leadsPerPartnerPerMonth: formData.leads_per_partner_per_month,
    });
  }, [formData]);

  const activeGoals = useMemo(() => {
    if (!activePlan) return null;
    return calculateBusinessPlan({
      incomeGoal: Number(activePlan.income_goal),
      purchaseBps: Number(activePlan.purchase_bps),
      refinanceBps: Number(activePlan.refinance_bps),
      purchasePercentage: Number(activePlan.purchase_percentage),
      avgLoanAmount: Number(activePlan.avg_loan_amount),
      pullThroughPurchase: Number(activePlan.pull_through_purchase),
      pullThroughRefinance: Number(activePlan.pull_through_refinance),
      conversionRatePurchase: Number(activePlan.conversion_rate_purchase),
      conversionRateRefinance: Number(activePlan.conversion_rate_refinance),
      leadsFromPartnersPercentage: Number(activePlan.leads_from_partners_percentage),
      leadsPerPartnerPerMonth: Number(activePlan.leads_per_partner_per_month),
    });
  }, [activePlan]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSubmit = () => {
    createPlan.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Business Planning & Goals
          </h1>
          <p className="text-muted-foreground mt-1">{currentYear} Production Goals & Tracking</p>
        </div>
      </div>

      <Tabs defaultValue={activePlan ? "dashboard" : "create"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="create">Create Plan</TabsTrigger>
          <TabsTrigger value="breakdown">Goal Breakdown</TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-4">
          {activePlan && activeGoals ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Income Goal"
                  value={formatCurrency(Number(activePlan.income_goal))}
                  actual={performance ? formatCurrency(Number(performance.ytd_profit)) : '--'}
                  achievement={performance ? calculateAchievement(Number(performance.ytd_profit), Number(performance.income_goal)) : 0}
                  icon={<DollarSign className="h-5 w-5" />}
                />
                <MetricCard
                  title="Volume Goal"
                  value={formatCurrencyShort(activeGoals.annualVolumeGoal)}
                  actual={performance ? formatCurrencyShort(Number(performance.ytd_volume)) : '--'}
                  achievement={performance ? calculateAchievement(Number(performance.ytd_volume), Number(performance.volume_goal)) : 0}
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                <MetricCard
                  title="Units Goal"
                  value={String(activeGoals.annualUnitsGoal)}
                  actual={performance ? String(performance.ytd_units) : '--'}
                  achievement={performance ? calculateAchievement(Number(performance.ytd_units), Number(performance.units_goal)) : 0}
                  icon={<BarChart3 className="h-5 w-5" />}
                />
                <MetricCard
                  title="Purchase Mix"
                  value={formatPercentage(Number(activePlan.purchase_percentage))}
                  actual={performance ? formatPercentage(Number(performance.purchase_mix)) : '--'}
                  achievement={performance ? Number(performance.purchase_mix) * 100 : 0}
                  icon={<Users className="h-5 w-5" />}
                />
              </div>

              {/* Monthly Targets */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Targets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <TargetItem label="Volume" value={formatCurrencyShort(activeGoals.monthlyVolumeTotal)} />
                    <TargetItem label="Units" value={String(activeGoals.monthlyUnitsTotal)} />
                    <TargetItem label="Applications" value={String(activeGoals.monthlyAppsTotal)} />
                    <TargetItem label="Leads Needed" value={String(activeGoals.monthlyLeadsTotal)} />
                  </div>
                </CardContent>
              </Card>

              {/* Lead Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Generation Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <TargetItem label="Partners Needed" value={String(activeGoals.partnersNeeded)} />
                    <TargetItem label="Monthly Partner Leads" value={String(activeGoals.monthlyPartnerLeads)} />
                    <TargetItem label="Monthly Self-Gen" value={String(activeGoals.monthlySelfGenLeads)} />
                    <TargetItem label="Weekly Leads" value={String(activeGoals.weeklyLeadsTotal)} />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No Active Plan</h3>
                <p className="text-muted-foreground mt-1">Create and activate a business plan to see your goals dashboard.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CREATE PLAN TAB */}
        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Parameters</CardTitle>
                <CardDescription>Enter your income and loan parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Annual Income Goal ($)" value={formData.income_goal} onChange={(v) => handleChange('income_goal', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Purchase BPS" value={formData.purchase_bps} onChange={(v) => handleChange('purchase_bps', v)} />
                  <FormField label="Refinance BPS" value={formData.refinance_bps} onChange={(v) => handleChange('refinance_bps', v)} />
                </div>
                <FormField label="Purchase % (0.01-0.99)" value={formData.purchase_percentage} onChange={(v) => handleChange('purchase_percentage', v)} step="0.01" />
                <FormField label="Avg Loan Amount ($)" value={formData.avg_loan_amount} onChange={(v) => handleChange('avg_loan_amount', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Pull-Through Purchase" value={formData.pull_through_purchase} onChange={(v) => handleChange('pull_through_purchase', v)} step="0.01" />
                  <FormField label="Pull-Through Refinance" value={formData.pull_through_refinance} onChange={(v) => handleChange('pull_through_refinance', v)} step="0.01" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Conv. Rate Purchase" value={formData.conversion_rate_purchase} onChange={(v) => handleChange('conversion_rate_purchase', v)} step="0.01" />
                  <FormField label="Conv. Rate Refinance" value={formData.conversion_rate_refinance} onChange={(v) => handleChange('conversion_rate_refinance', v)} step="0.01" />
                </div>
                <FormField label="Partner Leads %" value={formData.leads_from_partners_percentage} onChange={(v) => handleChange('leads_from_partners_percentage', v)} step="0.01" />
                <FormField label="Leads/Partner/Month" value={formData.leads_per_partner_per_month} onChange={(v) => handleChange('leads_per_partner_per_month', v)} />

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSubmit} disabled={createPlan.isPending} className="flex-1">
                    {createPlan.isPending ? 'Saving...' : 'Save as Draft'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Calculated Goals Preview</CardTitle>
                <CardDescription>Real-time calculation based on your inputs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <PreviewSection title="Summary">
                  <PreviewRow label="Weighted Commission" value={formatPercentage(calculatedGoals.weightedCommission)} />
                  <PreviewRow label="Annual Volume Goal" value={formatCurrencyShort(calculatedGoals.annualVolumeGoal)} />
                  <PreviewRow label="Annual Units Goal" value={String(calculatedGoals.annualUnitsGoal)} />
                </PreviewSection>
                <PreviewSection title="Monthly Targets">
                  <PreviewRow label="Volume" value={formatCurrencyShort(calculatedGoals.monthlyVolumeTotal)} />
                  <PreviewRow label="Units" value={String(calculatedGoals.monthlyUnitsTotal)} />
                  <PreviewRow label="Applications" value={String(calculatedGoals.monthlyAppsTotal)} />
                  <PreviewRow label="Leads" value={String(calculatedGoals.monthlyLeadsTotal)} />
                </PreviewSection>
                <PreviewSection title="Lead Generation">
                  <PreviewRow label="Partners Needed" value={String(calculatedGoals.partnersNeeded)} />
                  <PreviewRow label="Monthly Partner Leads" value={String(calculatedGoals.monthlyPartnerLeads)} />
                  <PreviewRow label="Monthly Self-Gen" value={String(calculatedGoals.monthlySelfGenLeads)} />
                </PreviewSection>
              </CardContent>
            </Card>
          </div>

          {/* Existing Plans */}
          {plans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Existing Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plans.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          plan.status === 'active' ? 'bg-success/10 text-success' :
                          plan.status === 'draft' ? 'bg-warning/10 text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {plan.status}
                        </span>
                        <span className="text-sm text-foreground">
                          {formatCurrency(Number(plan.income_goal))} income goal
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(plan.created_at!).toLocaleDateString()}
                        </span>
                      </div>
                      {plan.status === 'draft' && (
                        <Button size="sm" variant="outline" onClick={() => activatePlan.mutate(plan.id)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Activate
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* BREAKDOWN TAB */}
        <TabsContent value="breakdown" className="space-y-4">
          {activeGoals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BreakdownCard title="Volume Goals" data={[
                { period: 'Annual', purchase: formatCurrencyShort(activeGoals.annualVolumePurchase), refinance: formatCurrencyShort(activeGoals.annualVolumeRefinance), total: formatCurrencyShort(activeGoals.annualVolumeGoal) },
                { period: 'Monthly', purchase: formatCurrencyShort(activeGoals.monthlyVolumePurchase), refinance: formatCurrencyShort(activeGoals.monthlyVolumeRefinance), total: formatCurrencyShort(activeGoals.monthlyVolumeTotal) },
                { period: 'Weekly', purchase: formatCurrencyShort(activeGoals.weeklyVolumePurchase), refinance: formatCurrencyShort(activeGoals.weeklyVolumeRefinance), total: formatCurrencyShort(activeGoals.weeklyVolumeTotal) },
                { period: 'Daily', purchase: formatCurrencyShort(activeGoals.dailyVolumePurchase), refinance: formatCurrencyShort(activeGoals.dailyVolumeRefinance), total: formatCurrencyShort(activeGoals.dailyVolumeTotal) },
              ]} />
              <BreakdownCard title="Unit Goals" data={[
                { period: 'Annual', purchase: String(activeGoals.annualUnitsPurchase), refinance: String(activeGoals.annualUnitsRefinance), total: String(activeGoals.annualUnitsGoal) },
                { period: 'Monthly', purchase: String(activeGoals.monthlyUnitsPurchase), refinance: String(activeGoals.monthlyUnitsRefinance), total: String(activeGoals.monthlyUnitsTotal) },
                { period: 'Weekly', purchase: String(activeGoals.weeklyUnitsPurchase), refinance: String(activeGoals.weeklyUnitsRefinance), total: String(activeGoals.weeklyUnitsTotal) },
                { period: 'Daily', purchase: String(activeGoals.dailyUnitsPurchase), refinance: String(activeGoals.dailyUnitsRefinance), total: String(activeGoals.dailyUnitsTotal) },
              ]} />
              <BreakdownCard title="Application Goals" data={[
                { period: 'Annual', purchase: String(activeGoals.annualAppsPurchase), refinance: String(activeGoals.annualAppsRefinance), total: String(activeGoals.annualAppsTotal) },
                { period: 'Monthly', purchase: String(activeGoals.monthlyAppsPurchase), refinance: String(activeGoals.monthlyAppsRefinance), total: String(activeGoals.monthlyAppsTotal) },
                { period: 'Weekly', purchase: String(activeGoals.weeklyAppsPurchase), refinance: String(activeGoals.weeklyAppsRefinance), total: String(activeGoals.weeklyAppsTotal) },
                { period: 'Daily', purchase: String(activeGoals.dailyAppsPurchase), refinance: String(activeGoals.dailyAppsRefinance), total: String(activeGoals.dailyAppsTotal) },
              ]} />
              <Card>
                <CardHeader><CardTitle className="text-lg">Lead Generation</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <PreviewRow label="Annual Total Leads" value={String(activeGoals.annualLeadsTotal)} />
                  <PreviewRow label="Monthly Leads" value={String(activeGoals.monthlyLeadsTotal)} />
                  <PreviewRow label="Weekly Leads" value={String(activeGoals.weeklyLeadsTotal)} />
                  <PreviewRow label="Daily Leads" value={String(activeGoals.dailyLeadsTotal)} />
                  <div className="border-t border-border pt-2 mt-2">
                    <PreviewRow label="Partners Needed" value={String(activeGoals.partnersNeeded)} />
                    <PreviewRow label="Annual Partner Leads" value={String(activeGoals.annualPartnerLeads)} />
                    <PreviewRow label="Annual Self-Gen Leads" value={String(activeGoals.annualSelfGenLeads)} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Activate a business plan to see the full goal breakdown.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- Sub-components ---

function MetricCard({ title, value, actual, achievement, icon }: {
  title: string; value: string; actual: string; achievement: number; icon: React.ReactNode;
}) {
  const pct = Math.min(achievement, 100);
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
          <span className="text-primary">{icon}</span>
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
          <span>Actual: {actual}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <Progress value={pct} className="mt-2 h-2" />
      </CardContent>
    </Card>
  );
}

function TargetItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function FormField({ label, value, onChange, step }: {
  label: string; value: number; onChange: (v: string) => void; step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step || "1"}
        className="h-9"
      />
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function BreakdownCard({ title, data }: {
  title: string;
  data: { period: string; purchase: string; refinance: string; total: string }[];
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted-foreground font-medium">Period</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Purchase</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Refinance</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.period} className="border-b border-border/50">
                <td className="py-2 text-foreground">{row.period}</td>
                <td className="py-2 text-right text-foreground">{row.purchase}</td>
                <td className="py-2 text-right text-foreground">{row.refinance}</td>
                <td className="py-2 text-right font-semibold text-foreground">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export default GoalsPage;
