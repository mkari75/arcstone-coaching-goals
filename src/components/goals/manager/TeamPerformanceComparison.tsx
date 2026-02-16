import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercentage, calculateBusinessPlan } from '@/lib/calculations';
import type { BusinessPlan } from '@/lib/types/goals';
import { SummaryCard } from '@/components/goals/cards/SummaryCard';
import { DollarSign, TrendingUp, Users as UsersIcon } from 'lucide-react';

interface TeamPerformanceComparisonProps {
  plans: BusinessPlan[];
}

export function TeamPerformanceComparison({ plans }: TeamPerformanceComparisonProps) {
  const sortedPlans = [...plans].sort((a, b) => b.incomeGoal - a.incomeGoal);

  const teamTotals = plans.reduce(
    (acc, plan) => {
      const calc = calculateBusinessPlan(plan);
      return {
        incomeGoal: acc.incomeGoal + plan.incomeGoal,
        totalVolume: acc.totalVolume + calc.annualVolumeGoal,
        totalUnits: acc.totalUnits + calc.annualUnitsGoal,
      };
    },
    { incomeGoal: 0, totalVolume: 0, totalUnits: 0 }
  );

  if (!plans.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No active plans to compare.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Team Income Goal" value={formatCurrency(teamTotals.incomeGoal)}
          subtitle={`Across ${plans.length} loan officers`} icon={DollarSign} iconColor="text-primary" />
        <SummaryCard title="Team Volume Goal" value={formatCurrency(teamTotals.totalVolume)}
          subtitle="Total production target" icon={TrendingUp} iconColor="text-primary" />
        <SummaryCard title="Team Units Goal" value={String(teamTotals.totalUnits)}
          subtitle="Total loan units" icon={UsersIcon} iconColor="text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Individual Performance Targets</CardTitle>
          <CardDescription>Compare goals and metrics across your team</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Loan Officer</TableHead>
                <TableHead className="text-right">Income Goal</TableHead>
                <TableHead className="text-right">Volume Goal</TableHead>
                <TableHead className="text-right">Units Goal</TableHead>
                <TableHead className="text-right">Purchase %</TableHead>
                <TableHead className="text-right">% of Team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlans.map((plan, index) => {
                const calc = calculateBusinessPlan(plan);
                const teamPct = teamTotals.incomeGoal > 0 ? (plan.incomeGoal / teamTotals.incomeGoal) * 100 : 0;
                return (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>#{index + 1}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{plan.userId.slice(0, 8)}...</TableCell>
                    <TableCell className="text-right">{formatCurrency(plan.incomeGoal)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(calc.annualVolumeGoal)}</TableCell>
                    <TableCell className="text-right">{calc.annualUnitsGoal}</TableCell>
                    <TableCell className="text-right">{formatPercentage(plan.purchasePercentage)}</TableCell>
                    <TableCell className="text-right">{teamPct.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
