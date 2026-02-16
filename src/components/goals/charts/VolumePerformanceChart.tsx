import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrencyShort } from '@/lib/calculations';

interface ChartDataPoint {
  name: string;
  Goal: number;
  Actual: number;
}

interface VolumePerformanceChartProps {
  title: string;
  data: ChartDataPoint[];
  height?: number;
}

export function VolumePerformanceChart({ title, data, height = 300 }: VolumePerformanceChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrencyShort(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => formatCurrencyShort(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Goal" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
