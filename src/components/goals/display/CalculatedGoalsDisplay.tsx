import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DisplayField } from '../inputs/DisplayField';
import { CalculatedGoals, formatCurrencyShort, formatPercentage } from '@/lib/calculations';

interface CalculatedGoalsDisplayProps {
  goals: CalculatedGoals;
}

export function CalculatedGoalsDisplay({ goals }: CalculatedGoalsDisplayProps) {
  const volumeData = [
    { period: 'Annual', purchase: goals.annualVolumePurchase, refinance: goals.annualVolumeRefinance, total: goals.annualVolumeGoal, unitsPurchase: goals.annualUnitsPurchase, unitsRefinance: goals.annualUnitsRefinance, unitsTotal: goals.annualUnitsGoal },
    { period: 'Monthly', purchase: goals.monthlyVolumePurchase, refinance: goals.monthlyVolumeRefinance, total: goals.monthlyVolumeTotal, unitsPurchase: goals.monthlyUnitsPurchase, unitsRefinance: goals.monthlyUnitsRefinance, unitsTotal: goals.monthlyUnitsTotal },
    { period: 'Weekly', purchase: goals.weeklyVolumePurchase, refinance: goals.weeklyVolumeRefinance, total: goals.weeklyVolumeTotal, unitsPurchase: goals.weeklyUnitsPurchase, unitsRefinance: goals.weeklyUnitsRefinance, unitsTotal: goals.weeklyUnitsTotal },
    { period: 'Daily', purchase: goals.dailyVolumePurchase, refinance: goals.dailyVolumeRefinance, total: goals.dailyVolumeTotal, unitsPurchase: goals.dailyUnitsPurchase, unitsRefinance: goals.dailyUnitsRefinance, unitsTotal: goals.dailyUnitsTotal },
  ];

  const appData = [
    { period: 'Annual', purchase: goals.annualAppsPurchase, refinance: goals.annualAppsRefinance, total: goals.annualAppsTotal },
    { period: 'Monthly', purchase: goals.monthlyAppsPurchase, refinance: goals.monthlyAppsRefinance, total: goals.monthlyAppsTotal },
    { period: 'Weekly', purchase: goals.weeklyAppsPurchase, refinance: goals.weeklyAppsRefinance, total: goals.weeklyAppsTotal },
    { period: 'Daily', purchase: goals.dailyAppsPurchase, refinance: goals.dailyAppsRefinance, total: goals.dailyAppsTotal },
  ];

  const leadData = [
    { period: 'Annual', total: goals.annualLeadsTotal },
    { period: 'Monthly', total: goals.monthlyLeadsTotal },
    { period: 'Weekly', total: goals.weeklyLeadsTotal },
    { period: 'Daily', total: goals.dailyLeadsTotal },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DisplayField label="Weighted Commission" value={formatPercentage(goals.weightedCommission)} />
        <DisplayField label="Refinance %" value={formatPercentage(goals.refinancePercentage)} />
        <DisplayField label="Annual Volume Goal" value={formatCurrencyShort(goals.annualVolumeGoal)} />
        <DisplayField label="Annual Units Goal" value={goals.annualUnitsGoal.toLocaleString()} />
      </div>

      {/* Production Goals */}
      <Card>
        <CardHeader><CardTitle className="text-base">Production Goals by Period</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Purchase Volume</TableHead>
                <TableHead className="text-right">Refi Volume</TableHead>
                <TableHead className="text-right">Total Volume</TableHead>
                <TableHead className="text-right">Purchase Units</TableHead>
                <TableHead className="text-right">Refi Units</TableHead>
                <TableHead className="text-right">Total Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volumeData.map(row => (
                <TableRow key={row.period}>
                  <TableCell className="font-medium">{row.period}</TableCell>
                  <TableCell className="text-right">{formatCurrencyShort(row.purchase)}</TableCell>
                  <TableCell className="text-right">{formatCurrencyShort(row.refinance)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrencyShort(row.total)}</TableCell>
                  <TableCell className="text-right">{row.unitsPurchase}</TableCell>
                  <TableCell className="text-right">{row.unitsRefinance}</TableCell>
                  <TableCell className="text-right font-semibold">{row.unitsTotal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Application Goals */}
      <Card>
        <CardHeader><CardTitle className="text-base">Application Goals (Adjusted for Pull-Through)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Purchase Apps</TableHead>
                <TableHead className="text-right">Refi Apps</TableHead>
                <TableHead className="text-right">Total Apps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appData.map(row => (
                <TableRow key={row.period}>
                  <TableCell className="font-medium">{row.period}</TableCell>
                  <TableCell className="text-right">{row.purchase}</TableCell>
                  <TableCell className="text-right">{row.refinance}</TableCell>
                  <TableCell className="text-right font-semibold">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lead Generation */}
      <Card>
        <CardHeader><CardTitle className="text-base">Lead Generation Goals (Adjusted for Conversion)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Total Leads Required</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadData.map(row => (
                <TableRow key={row.period}>
                  <TableCell className="font-medium">{row.period}</TableCell>
                  <TableCell className="text-right font-semibold">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader><CardTitle className="text-base">Strategic Partner Leads</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <DisplayField label="Annual Target" value={goals.annualPartnerLeads.toLocaleString()} />
                <DisplayField label="Monthly Target" value={goals.monthlyPartnerLeads.toLocaleString()} />
                <DisplayField label="Partners Needed" value={goals.partnersNeeded} />
                <p className="text-xs text-muted-foreground">
                  Based on {goals.partnersNeeded > 0 ? Math.round(goals.monthlyPartnerLeads / goals.partnersNeeded) : 0} leads per partner per month
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200/50">
              <CardHeader><CardTitle className="text-base">Self-Generated Leads</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <DisplayField label="Annual Target" value={goals.annualSelfGenLeads.toLocaleString()} />
                <DisplayField label="Monthly Target" value={goals.monthlySelfGenLeads.toLocaleString()} />
                <p className="text-xs text-muted-foreground">
                  Focus on database marketing, social media, networking events, and past client referrals
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
