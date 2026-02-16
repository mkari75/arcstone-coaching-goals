import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/calculations';
import { MonthlyAggregate } from '@/lib/types/goals';

interface MonthlyBreakdownTableProps {
  data: MonthlyAggregate[];
}

export function MonthlyBreakdownTable({ data }: MonthlyBreakdownTableProps) {
  const getAchievementBadge = (actual: number, goal: number) => {
    if (goal === 0) return <Badge variant="secondary">--</Badge>;
    const pct = (actual / goal) * 100;
    if (pct >= 100) return <Badge className="bg-green-500 text-white">✓ {pct.toFixed(0)}%</Badge>;
    if (pct >= 75) return <Badge className="bg-blue-500 text-white">{pct.toFixed(0)}%</Badge>;
    if (pct >= 50) return <Badge className="bg-yellow-500 text-white">{pct.toFixed(0)}%</Badge>;
    return <Badge className="bg-red-500 text-white">{pct.toFixed(0)}%</Badge>;
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Monthly Breakdown</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Goal</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Compensation</TableHead>
              <TableHead className="text-right">Achievement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium">{row.monthName}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.volume)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.volumeGoal)}</TableCell>
                <TableCell className="text-right">{row.units}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.compensation)}</TableCell>
                <TableCell className="text-right">{getAchievementBadge(row.volume, row.volumeGoal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
