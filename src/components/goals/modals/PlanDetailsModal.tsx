import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { calculateBusinessPlan, formatCurrency, formatPercentage } from '@/lib/calculations';
import { CalculatedGoalsDisplay } from '@/components/goals/display/CalculatedGoalsDisplay';
import type { BusinessPlan } from '@/lib/types/goals';
import { Badge } from '@/components/ui/badge';

interface PlanDetailsModalProps {
  open: boolean;
  onClose: () => void;
  plan: BusinessPlan | null;
}

export function PlanDetailsModal({ open, onClose, plan }: PlanDetailsModalProps) {
  if (!plan) return null;

  const calculated = calculateBusinessPlan(plan);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Plan Details
            <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>{plan.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            {plan.planYear} Business Plan — Income Goal: {formatCurrency(plan.incomeGoal)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg border border-border">
            <div><span className="text-xs text-muted-foreground">Purchase BPS</span><p className="text-sm font-medium">{plan.purchaseBps}</p></div>
            <div><span className="text-xs text-muted-foreground">Refinance BPS</span><p className="text-sm font-medium">{plan.refinanceBps}</p></div>
            <div><span className="text-xs text-muted-foreground">Purchase %</span><p className="text-sm font-medium">{formatPercentage(plan.purchasePercentage)}</p></div>
            <div><span className="text-xs text-muted-foreground">Avg Loan</span><p className="text-sm font-medium">{formatCurrency(plan.avgLoanAmount)}</p></div>
            <div><span className="text-xs text-muted-foreground">Pull-Through Purchase</span><p className="text-sm font-medium">{formatPercentage(plan.pullThroughPurchase)}</p></div>
            <div><span className="text-xs text-muted-foreground">Pull-Through Refinance</span><p className="text-sm font-medium">{formatPercentage(plan.pullThroughRefinance)}</p></div>
            <div><span className="text-xs text-muted-foreground">Conv. Rate Purchase</span><p className="text-sm font-medium">{formatPercentage(plan.conversionRatePurchase)}</p></div>
            <div><span className="text-xs text-muted-foreground">Conv. Rate Refinance</span><p className="text-sm font-medium">{formatPercentage(plan.conversionRateRefinance)}</p></div>
          </div>

          <CalculatedGoalsDisplay goals={calculated} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
