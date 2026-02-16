import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Target, TrendingUp, DollarSign, Users, BarChart3, Plus, Trash2, FileEdit } from 'lucide-react';
import {
  useActivePlan, useSaveBusinessPlan, useActualProduction, useAddLoan,
  useDeleteLoan, usePerformanceMetrics, usePlanRevisions, useCreateRevision,
} from '@/hooks/useGoals';
import { calculateBusinessPlan, formatCurrency, formatCurrencyShort, formatPercentage } from '@/lib/calculations';
import { fieldDisplayNames, formatFieldValue, revisionFieldOptions } from '@/lib/validations/goals';
import type { BusinessPlan } from '@/lib/types/goals';
import { CurrencyField } from '@/components/goals/inputs/CurrencyField';
import { PercentField } from '@/components/goals/inputs/PercentField';
import { InputField } from '@/components/goals/inputs/InputField';
import { PerformanceCard } from '@/components/goals/cards/PerformanceCard';
import { SummaryCard } from '@/components/goals/cards/SummaryCard';
import { CalculatedGoalsDisplay } from '@/components/goals/display/CalculatedGoalsDisplay';

const GoalsPage = () => {
  const currentYear = new Date().getFullYear();
  const { data: activePlan, isLoading: planLoading } = useActivePlan(undefined, currentYear);
  const savePlan = useSaveBusinessPlan();
  const { data: production, isLoading: prodLoading } = useActualProduction(undefined, currentYear);
  const addLoan = useAddLoan();
  const deleteLoan = useDeleteLoan();
  const { data: performance } = usePerformanceMetrics(undefined, currentYear);
  const { data: revisions } = usePlanRevisions();
  const createRevision = useCreateRevision();

  const [formData, setFormData] = useState({
    incomeGoal: 200000, purchaseBps: 125, refinanceBps: 100,
    purchasePercentage: 0.7, avgLoanAmount: 350000,
    pullThroughPurchase: 0.8, pullThroughRefinance: 0.75,
    conversionRatePurchase: 0.5, conversionRateRefinance: 0.45,
    leadsFromPartnersPercentage: 0.2, leadsPerPartnerPerMonth: 1,
  });

  const [loanForm, setLoanForm] = useState({
    borrowerFullName: '', loanNumber: '', loanAmount: 0, loBps: 0,
    loCompensation: 0, transactionType: 'Purchase', loanType: 'Conventional',
    occupancy: 'Primary', closeDate: '',
  });

  const [revisionForm, setRevisionForm] = useState({
    fieldToChange: '', requestedValue: 0, loJustification: '', effectiveDate: '',
  });

  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const calculatedGoals = useMemo(() => calculateBusinessPlan(formData), [formData]);

  const activeGoals = useMemo(() => {
    if (!activePlan) return null;
    return calculateBusinessPlan({
      incomeGoal: activePlan.incomeGoal, purchaseBps: activePlan.purchaseBps,
      refinanceBps: activePlan.refinanceBps, purchasePercentage: activePlan.purchasePercentage,
      avgLoanAmount: activePlan.avgLoanAmount, pullThroughPurchase: activePlan.pullThroughPurchase,
      pullThroughRefinance: activePlan.pullThroughRefinance,
      conversionRatePurchase: activePlan.conversionRatePurchase,
      conversionRateRefinance: activePlan.conversionRateRefinance,
      leadsFromPartnersPercentage: activePlan.leadsFromPartnersPercentage,
      leadsPerPartnerPerMonth: activePlan.leadsPerPartnerPerMonth,
    });
  }, [activePlan]);

  const handleSaveFormData = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePlan = () => {
    savePlan.mutate({
      planYear: currentYear,
      incomeGoal: formData.incomeGoal, purchaseBps: formData.purchaseBps,
      refinanceBps: formData.refinanceBps, purchasePercentage: formData.purchasePercentage,
      avgLoanAmount: formData.avgLoanAmount, pullThroughPurchase: formData.pullThroughPurchase,
      pullThroughRefinance: formData.pullThroughRefinance,
      conversionRatePurchase: formData.conversionRatePurchase,
      conversionRateRefinance: formData.conversionRateRefinance,
      leadsFromPartnersPercentage: formData.leadsFromPartnersPercentage,
      leadsPerPartnerPerMonth: formData.leadsPerPartnerPerMonth,
    } as Partial<BusinessPlan>);
  };

  const handleAddLoan = () => {
    addLoan.mutate(loanForm, {
      onSuccess: () => {
        setLoanForm({ borrowerFullName: '', loanNumber: '', loanAmount: 0, loBps: 0, loCompensation: 0, transactionType: 'Purchase', loanType: 'Conventional', occupancy: 'Primary', closeDate: '' });
        setShowLoanForm(false);
      },
    });
  };

  const handleRevisionRequest = () => {
    if (!activePlan) return;
    const currentVal = (activePlan as any)[revisionForm.fieldToChange] ?? 0;
    createRevision.mutate({
      originalPlanId: activePlan.id,
      fieldToChange: revisionForm.fieldToChange,
      currentValue: currentVal,
      requestedValue: revisionForm.requestedValue,
      loJustification: revisionForm.loJustification,
      effectiveDate: revisionForm.effectiveDate,
    }, {
      onSuccess: () => {
        setRevisionForm({ fieldToChange: '', requestedValue: 0, loJustification: '', effectiveDate: '' });
        setShowRevisionForm(false);
      },
    });
  };

  if (planLoading) {
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

      <Tabs defaultValue={activePlan ? "dashboard" : "plan"} className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="plan">Business Plan</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="breakdown">Goal Breakdown</TabsTrigger>
          <TabsTrigger value="revisions">Revisions</TabsTrigger>
        </TabsList>

        {/* ===== DASHBOARD ===== */}
        <TabsContent value="dashboard" className="space-y-4">
          {activePlan && activeGoals ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PerformanceCard title="Income" actual={performance?.ytdProfit ?? 0}
                  goal={activePlan.incomeGoal} achievement={performance?.profitAchievement ?? 0}
                  icon={<DollarSign className="h-5 w-5" />} />
                <PerformanceCard title="Volume" actual={performance?.ytdVolume ?? 0}
                  goal={activeGoals.annualVolumeGoal} achievement={performance?.volumeAchievement ?? 0}
                  icon={<TrendingUp className="h-5 w-5" />} compact />
                <PerformanceCard title="Units" actual={performance?.ytdUnits ?? 0}
                  goal={activeGoals.annualUnitsGoal} achievement={performance?.unitsAchievement ?? 0}
                  format="number" icon={<BarChart3 className="h-5 w-5" />} />
                <PerformanceCard title="Purchase Mix" actual={(performance?.purchaseMix ?? 0) * 100}
                  goal={activePlan.purchasePercentage * 100}
                  achievement={performance ? (performance.purchaseMix / activePlan.purchasePercentage) * 100 : 0}
                  format="percentage" icon={<Users className="h-5 w-5" />} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SummaryCard title="Monthly Volume" value={formatCurrencyShort(activeGoals.monthlyVolumeTotal)}
                  subtitle="Target" icon={TrendingUp} iconColor="text-primary" />
                <SummaryCard title="Monthly Units" value={String(activeGoals.monthlyUnitsTotal)}
                  subtitle="Target" icon={BarChart3} iconColor="text-primary" />
                <SummaryCard title="Monthly Apps" value={String(activeGoals.monthlyAppsTotal)}
                  subtitle="Applications" icon={Target} iconColor="text-primary" />
                <SummaryCard title="Partners Needed" value={String(activeGoals.partnersNeeded)}
                  subtitle={`${activeGoals.monthlyPartnerLeads} leads/mo`} icon={Users} iconColor="text-primary" />
              </div>
            </>
          ) : (
            <Card><CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No Active Plan</h3>
              <p className="text-muted-foreground mt-1">Create a business plan in the "Business Plan" tab to get started.</p>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ===== BUSINESS PLAN ===== */}
        <TabsContent value="plan" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Parameters</CardTitle>
                <CardDescription>Enter your income and loan parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CurrencyField label="Annual Income Goal" value={formData.incomeGoal}
                  onChange={(v) => handleSaveFormData('incomeGoal', v)} required />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Purchase BPS" value={formData.purchaseBps}
                    onChange={(v) => handleSaveFormData('purchaseBps', v)} suffix="BPS" min={50} max={500} />
                  <InputField label="Refinance BPS" value={formData.refinanceBps}
                    onChange={(v) => handleSaveFormData('refinanceBps', v)} suffix="BPS" min={50} max={500} />
                </div>
                <PercentField label="Purchase Percentage" value={formData.purchasePercentage}
                  onChange={(v) => handleSaveFormData('purchasePercentage', v)} showSlider min={1} max={99} />
                <CurrencyField label="Avg Loan Amount" value={formData.avgLoanAmount}
                  onChange={(v) => handleSaveFormData('avgLoanAmount', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <PercentField label="Pull-Through Purchase" value={formData.pullThroughPurchase}
                    onChange={(v) => handleSaveFormData('pullThroughPurchase', v)} />
                  <PercentField label="Pull-Through Refinance" value={formData.pullThroughRefinance}
                    onChange={(v) => handleSaveFormData('pullThroughRefinance', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <PercentField label="Conv. Rate Purchase" value={formData.conversionRatePurchase}
                    onChange={(v) => handleSaveFormData('conversionRatePurchase', v)} />
                  <PercentField label="Conv. Rate Refinance" value={formData.conversionRateRefinance}
                    onChange={(v) => handleSaveFormData('conversionRateRefinance', v)} />
                </div>
                <PercentField label="Partner Leads %" value={formData.leadsFromPartnersPercentage}
                  onChange={(v) => handleSaveFormData('leadsFromPartnersPercentage', v)} />
                <InputField label="Leads/Partner/Month" value={formData.leadsPerPartnerPerMonth}
                  onChange={(v) => handleSaveFormData('leadsPerPartnerPerMonth', v)} min={0.5} max={20} step={0.5} decimals={1} />
                <Button onClick={handleSavePlan} disabled={savePlan.isPending} className="w-full">
                  {savePlan.isPending ? 'Saving...' : activePlan ? 'Update Active Plan' : 'Save & Activate Plan'}
                </Button>
              </CardContent>
            </Card>
            <div>
              <CalculatedGoalsDisplay goals={calculatedGoals} />
            </div>
          </div>
        </TabsContent>

        {/* ===== PRODUCTION ===== */}
        <TabsContent value="production" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Funded Loans ({currentYear})</h2>
            <Button size="sm" onClick={() => setShowLoanForm(!showLoanForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add Loan
            </Button>
          </div>

          {showLoanForm && (
            <Card>
              <CardHeader><CardTitle className="text-base">New Funded Loan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Borrower Name</Label>
                    <Input value={loanForm.borrowerFullName} onChange={e => setLoanForm(p => ({ ...p, borrowerFullName: e.target.value }))} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Loan Number</Label>
                    <Input value={loanForm.loanNumber} onChange={e => setLoanForm(p => ({ ...p, loanNumber: e.target.value }))} className="h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Loan Amount</Label>
                    <Input type="number" value={loanForm.loanAmount} onChange={e => setLoanForm(p => ({ ...p, loanAmount: parseFloat(e.target.value) || 0 }))} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">LO BPS</Label>
                    <Input type="number" value={loanForm.loBps} onChange={e => setLoanForm(p => ({ ...p, loBps: parseFloat(e.target.value) || 0 }))} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">LO Compensation</Label>
                    <Input type="number" value={loanForm.loCompensation} onChange={e => setLoanForm(p => ({ ...p, loCompensation: parseFloat(e.target.value) || 0 }))} className="h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Transaction Type</Label>
                    <Select value={loanForm.transactionType} onValueChange={v => setLoanForm(p => ({ ...p, transactionType: v }))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Purchase">Purchase</SelectItem>
                        <SelectItem value="Refinance">Refinance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Loan Type</Label>
                    <Select value={loanForm.loanType} onValueChange={v => setLoanForm(p => ({ ...p, loanType: v }))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Conventional','FHA','VA','USDA','Jumbo','Non-QM','Other'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Close Date</Label>
                    <Input type="date" value={loanForm.closeDate} onChange={e => setLoanForm(p => ({ ...p, closeDate: e.target.value }))} className="h-9" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddLoan} disabled={addLoan.isPending} size="sm">
                    {addLoan.isPending ? 'Adding...' : 'Add Loan'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowLoanForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-4">
              {prodLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : !production?.length ? (
                <p className="text-muted-foreground text-center py-8">No funded loans recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">Borrower</th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">Loan #</th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-medium">Amount</th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">Type</th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-medium">Comp</th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">Close Date</th>
                        <th className="text-right py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {production.map(loan => (
                        <tr key={loan.id} className="border-b border-border/50">
                          <td className="py-2 px-2 text-foreground">{loan.borrowerFullName}</td>
                          <td className="py-2 px-2 text-foreground">{loan.loanNumber}</td>
                          <td className="py-2 px-2 text-right text-foreground">{formatCurrency(loan.loanAmount)}</td>
                          <td className="py-2 px-2"><Badge variant="secondary">{loan.transactionType}</Badge></td>
                          <td className="py-2 px-2 text-right text-foreground">{formatCurrency(loan.loCompensation)}</td>
                          <td className="py-2 px-2 text-foreground">{loan.closeDate}</td>
                          <td className="py-2 px-2 text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteLoan.mutate(loan.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== BREAKDOWN ===== */}
        <TabsContent value="breakdown" className="space-y-4">
          {activeGoals ? (
            <CalculatedGoalsDisplay goals={activeGoals} />
          ) : (
            <Card><CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Activate a business plan to see the full goal breakdown.</p>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ===== REVISIONS ===== */}
        <TabsContent value="revisions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Plan Revision Requests</h2>
            {activePlan && (
              <Button size="sm" onClick={() => setShowRevisionForm(!showRevisionForm)}>
                <FileEdit className="h-4 w-4 mr-1" /> Request Revision
              </Button>
            )}
          </div>

          {showRevisionForm && activePlan && (
            <Card>
              <CardHeader><CardTitle className="text-base">New Revision Request</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Field to Change</Label>
                    <Select value={revisionForm.fieldToChange} onValueChange={v => setRevisionForm(p => ({ ...p, fieldToChange: v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select field" /></SelectTrigger>
                      <SelectContent>
                        {revisionFieldOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Requested Value</Label>
                    <Input type="number" value={revisionForm.requestedValue} onChange={e => setRevisionForm(p => ({ ...p, requestedValue: parseFloat(e.target.value) || 0 }))} className="h-9" />
                  </div>
                </div>
                {revisionForm.fieldToChange && (
                  <p className="text-xs text-muted-foreground">
                    Current value: {formatFieldValue(revisionForm.fieldToChange, (activePlan as any)[revisionForm.fieldToChange] ?? 0)}
                  </p>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Effective Date</Label>
                  <Input type="date" value={revisionForm.effectiveDate} onChange={e => setRevisionForm(p => ({ ...p, effectiveDate: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Justification (min 100 chars)</Label>
                  <Textarea value={revisionForm.loJustification} onChange={e => setRevisionForm(p => ({ ...p, loJustification: e.target.value }))} rows={4} placeholder="Explain why this revision is needed..." />
                  <p className="text-xs text-muted-foreground">{revisionForm.loJustification.length}/100 characters</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRevisionRequest} disabled={createRevision.isPending || revisionForm.loJustification.length < 100} size="sm">
                    {createRevision.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowRevisionForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-4">
              {!revisions?.length ? (
                <p className="text-muted-foreground text-center py-8">No revision requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {revisions.map(rev => (
                    <div key={rev.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {fieldDisplayNames[rev.fieldToChange] || rev.fieldToChange}
                        </span>
                        <Badge variant={rev.status === 'approved' ? 'default' : rev.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {rev.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Current: {formatFieldValue(rev.fieldToChange, rev.currentValue)} → Requested: {formatFieldValue(rev.fieldToChange, rev.requestedValue)}</p>
                        <p>Submitted: {new Date(rev.requestedAt).toLocaleDateString()}</p>
                        {rev.managerNotes && <p className="text-foreground mt-1">Manager: {rev.managerNotes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoalsPage;
