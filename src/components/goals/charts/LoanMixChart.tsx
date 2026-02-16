import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieDataPoint {
  name: string;
  value: number;
}

interface LoanMixChartProps {
  title: string;
  data: PieDataPoint[];
  height?: number;
}

const COLORS = ['#001634', '#2a4a6b', '#4d7ea8', '#6ba3d6', '#a8c8e8', '#8F9199', '#DCDDDE'];

export function LoanMixChart({ title, data, height = 300 }: LoanMixChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-muted-foreground">
            {payload[0].value} loans ({((payload[0].value / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data.length || total === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-8">No data available</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={CustomLabel}
              outerRadius={100} fill="#8884d8" dataKey="value">
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
