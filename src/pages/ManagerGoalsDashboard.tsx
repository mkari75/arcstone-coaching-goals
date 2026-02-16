import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, CheckCircle, Clock, XCircle, Target, AlertCircle, Eye } from 'lucide-react';
import { useAllBusinessPlans, usePendingRevisions, useAuditEntries } from '@/hooks/useGoals';
import { RevisionApprovalModal } from '@/components/goals/modals/RevisionApprovalModal';
import { TeamPerformanceComparison } from '@/components/goals/manager/TeamPerformanceComparison';
import { GoalsAuditTrail } from '@/components/goals/manager/GoalsAuditTrail';
import { PlanDetailsModal } from '@/components/goals/modals/PlanDetailsModal';
import { formatCurrency, formatPercentage, calculateBusinessPlan } from '@/lib/calculations';
import { formatFieldValue, fieldDisplayNames } from '@/lib/validations/goals';
import type { PlanRevision, BusinessPlan } from '@/lib/types/goals';
import { SummaryCard } from '@/components/goals/cards/SummaryCard';

export default function ManagerGoalsDashboard() {
  const currentYear = new Date().getFullYear();
  const { data: allPlans, isLoading: plansLoading } = useAllBusinessPlans(currentYear);
  const { data: allRevisions, isLoading: revisionsLoading } = usePendingRevisions();
  const { data: auditEntries } = useAuditEntries();

  const [selectedRevision, setSelectedRevision] = useState<PlanRevision | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<BusinessPlan | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const activePlans = allPlans?.filter(p => p.status === 'active') ?? [];
  const draftPlans = allPlans?.filter(p => p.status === 'draft') ?? [];

  const pendingRevisions = allRevisions?.filter(r => r.status === 'pending') ?? [];
  const approvedRevisions = allRevisions?.filter(r => r.status === 'approved') ?? [];
  const rejectedRevisions = allRevisions?.filter(r => r.status === 'rejected') ?? [];

  const handleApproveClick = (revision: PlanRevision) => {
    setSelectedRevision(revision);
    setShowApprovalModal(true);
  };

  const handleViewPlan = (plan: BusinessPlan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        <Users className="h-12 w-12 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Team Goals Management
        </h1>
        <p className="text-muted-foreground mt-1">Review, approve, and track your team's business goals</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="Active Plans" value={String(activePlans.length)}
          subtitle={`${draftPlans.length} drafts pending`} icon={Target} iconColor="text-primary" />
        <SummaryCard title="Pending Approvals" value={String(pendingRevisions.length)}
          subtitle="Revision requests awaiting review" icon={Clock} iconColor="text-yellow-600" />
        <SummaryCard title="Approved" value={String(approvedRevisions.length)}
          subtitle="This quarter" icon={CheckCircle} iconColor="text-green-600" />
        <SummaryCard title="Rejected" value={String(rejectedRevisions.length)}
          subtitle="This quarter" icon={XCircle} iconColor="text-destructive" />
      </div>

      {pendingRevisions.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {pendingRevisions.length} revision request{pendingRevisions.length > 1 ? 's' : ''} requiring your attention
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="approvals" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="approvals">Approvals ({pendingRevisions.length})</TabsTrigger>
          <TabsTrigger value="plans">All Plans ({activePlans.length})</TabsTrigger>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* APPROVALS TAB */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Revision Requests</CardTitle>
              <CardDescription>Review and approve or reject plan revisions from your team</CardDescription>
            </CardHeader>
            <CardContent>
              {revisionsLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading revisions...</p>
              ) : !pendingRevisions.length ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">No pending revision requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan Officer</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Requested</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRevisions.map((rev) => (
                      <TableRow key={rev.id}>
                        <TableCell className="font-medium">{rev.requestedByName || 'Unknown'}</TableCell>
                        <TableCell>{fieldDisplayNames[rev.fieldToChange] || rev.fieldToChange}</TableCell>
                        <TableCell className="text-right">{formatFieldValue(rev.fieldToChange, rev.currentValue)}</TableCell>
                        <TableCell className="text-right">{formatFieldValue(rev.fieldToChange, rev.requestedValue)}</TableCell>
                        <TableCell>{new Date(rev.requestedAt).toLocaleDateString()}</TableCell>
                        <TableCell><Badge className="bg-yellow-100 text-yellow-800">Pending</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleApproveClick(rev)}>Review</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALL PLANS TAB */}
        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Business Plans</CardTitle>
              <CardDescription>View and monitor all active business plans</CardDescription>
            </CardHeader>
            <CardContent>
              {!activePlans.length ? (
                <p className="text-muted-foreground text-center py-8">No active plans found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan Officer</TableHead>
                      <TableHead className="text-right">Income Goal</TableHead>
                      <TableHead className="text-right">Total Volume</TableHead>
                      <TableHead className="text-right">Total Units</TableHead>
                      <TableHead className="text-right">Purchase %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePlans.map((plan) => {
                      const calc = calculateBusinessPlan(plan);
                      return (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.userId.slice(0, 8)}...</TableCell>
                          <TableCell className="text-right">{formatCurrency(plan.incomeGoal)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(calc.annualVolumeGoal)}</TableCell>
                          <TableCell className="text-right">{calc.annualUnitsGoal}</TableCell>
                          <TableCell className="text-right">{formatPercentage(plan.purchasePercentage)}</TableCell>
                          <TableCell><Badge className="bg-green-100 text-green-800">Active</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewPlan(plan)}>
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEAM PERFORMANCE TAB */}
        <TabsContent value="performance">
          <TeamPerformanceComparison plans={activePlans} />
        </TabsContent>

        {/* AUDIT TRAIL TAB */}
        <TabsContent value="audit">
          <GoalsAuditTrail entries={auditEntries ?? []} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedRevision && (
        <RevisionApprovalModal
          open={showApprovalModal}
          onClose={() => { setShowApprovalModal(false); setSelectedRevision(null); }}
          revision={selectedRevision}
        />
      )}

      <PlanDetailsModal
        open={showPlanModal}
        onClose={() => { setShowPlanModal(false); setSelectedPlan(null); }}
        plan={selectedPlan}
      />
    </div>
  );
}
