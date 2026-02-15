import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3, TrendingUp, Users, Shield, Download, Printer,
  Activity, Phone, Mail, Calendar as CalendarIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { useActivityTrends, useComplianceBreakdown, useTeamPerformance } from '@/hooks/useAnalytics';
import { exportToCSV, printReport } from '@/lib/exportUtils';
import { subDays, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', '#f59e0b'];

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({ start: subDays(new Date(), 30), end: new Date() });
  const [grouping, setGrouping] = useState<'day' | 'week' | 'month'>('day');

  const { data: activityTrends, isLoading: trendsLoading } = useActivityTrends(undefined, dateRange.start, dateRange.end, grouping);
  const { data: complianceBreakdown, isLoading: complianceLoading } = useComplianceBreakdown();
  const { data: teamPerformance, isLoading: teamLoading } = useTeamPerformance(dateRange.start, dateRange.end);

  const handlePresetRange = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case 'last7': setDateRange({ start: subDays(now, 7), end: now }); break;
      case 'last30': setDateRange({ start: subDays(now, 30), end: now }); break;
      case 'last90': setDateRange({ start: subDays(now, 90), end: now }); break;
      case 'thisMonth': setDateRange({ start: startOfMonth(now), end: now }); break;
      case 'lastMonth': {
        const lm = subMonths(now, 1);
        setDateRange({ start: startOfMonth(lm), end: endOfMonth(lm) });
        break;
      }
    }
  };

  const summaryStats = useMemo(() => {
    if (!activityTrends?.length) return { activities: 0, points: 0, calls: 0, meetings: 0 };
    return {
      activities: activityTrends.reduce((s, t) => s + t.total_activities, 0),
      points: activityTrends.reduce((s, t) => s + t.total_points, 0),
      calls: activityTrends.reduce((s, t) => s + t.calls_count, 0),
      meetings: activityTrends.reduce((s, t) => s + t.meetings_count, 0),
    };
  }, [activityTrends]);

  const handleExportActivity = () => {
    if (!activityTrends) return;
    exportToCSV({
      filename: `activity-trends-${format(new Date(), 'yyyy-MM-dd')}`,
      columns: [
        { key: 'period', label: 'Period' },
        { key: 'total_activities', label: 'Activities' },
        { key: 'total_points', label: 'Points' },
        { key: 'calls_count', label: 'Calls' },
        { key: 'emails_count', label: 'Emails' },
        { key: 'meetings_count', label: 'Meetings' },
      ],
      data: activityTrends as any,
    });
  };

  const handleExportTeam = () => {
    if (!teamPerformance) return;
    exportToCSV({
      filename: `team-performance-${format(new Date(), 'yyyy-MM-dd')}`,
      columns: [
        { key: 'rank', label: 'Rank' },
        { key: 'full_name', label: 'Name' },
        { key: 'total_activities', label: 'Activities' },
        { key: 'total_points', label: 'Points' },
        { key: 'momentum_score', label: 'Momentum' },
        { key: 'current_streak', label: 'Streak' },
      ],
      data: teamPerformance as any,
    });
  };

  const handlePrintTeam = () => {
    if (!teamPerformance) return;
    printReport({
      filename: 'team-performance',
      title: 'Team Performance Report',
      columns: [
        { key: 'rank', label: 'Rank' },
        { key: 'full_name', label: 'Name' },
        { key: 'total_activities', label: 'Activities' },
        { key: 'total_points', label: 'Points' },
        { key: 'momentum_score', label: 'Momentum' },
      ],
      data: teamPerformance as any,
    });
  };

  const statCards = [
    { icon: Activity, label: 'Total Activities', value: summaryStats.activities.toLocaleString(), color: 'bg-primary' },
    { icon: TrendingUp, label: 'Total Points', value: summaryStats.points.toLocaleString(), color: 'bg-accent' },
    { icon: Phone, label: 'Calls Made', value: summaryStats.calls.toLocaleString(), color: 'bg-blue-600' },
    { icon: CalendarIcon, label: 'Meetings', value: summaryStats.meetings.toLocaleString(), color: 'bg-orange-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Analytics & Reports</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select onValueChange={handlePresetRange} defaultValue="last30">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="last90">Last 90 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={grouping} onValueChange={(v) => setGrouping(v as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {format(dateRange.start, 'MMM d, yyyy')} – {format(dateRange.end, 'MMM d, yyyy')}
      </p>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="activity" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> Activity
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-1">
            <Shield className="w-4 h-4" /> Compliance
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-1">
            <Users className="w-4 h-4" /> Team
          </TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Activity Trends</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportActivity}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : !activityTrends?.length ? (
                <p className="text-center text-muted-foreground py-12">No activity data for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="calls_count" name="Calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="emails_count" name="Emails" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="meetings_count" name="Meetings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Points Trend Line Chart */}
          {activityTrends && activityTrends.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Points Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={activityTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="total_points" name="Points" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="total_activities" name="Activities" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Compliance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {complianceLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : !complianceBreakdown?.length ? (
                <p className="text-center text-muted-foreground py-12">No compliance data available.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={complianceBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="completed"
                        nameKey="category"
                        label={({ category, completion_rate }) => `${category}: ${completion_rate ?? 0}%`}
                      >
                        {complianceBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-4">
                    {complianceBreakdown.map((item) => (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-foreground">{item.category}</span>
                          <span className="text-muted-foreground">{item.completed}/{item.total}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${item.completion_rate ?? 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{item.completion_rate ?? 0}% complete</span>
                          <span>{item.pending} pending</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Team Performance</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportTeam}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintTeam}>
                  <Printer className="w-4 h-4 mr-1" /> Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : !teamPerformance?.length ? (
                <p className="text-center text-muted-foreground py-12">No team data available.</p>
              ) : (
                <div className="space-y-4">
                  {/* Bar chart of points by team member */}
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={teamPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="full_name" type="category" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Bar dataKey="total_points" name="Points" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Table view */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-3 font-medium text-foreground">#</th>
                          <th className="text-left p-3 font-medium text-foreground">Name</th>
                          <th className="text-right p-3 font-medium text-foreground">Activities</th>
                          <th className="text-right p-3 font-medium text-foreground">Points</th>
                          <th className="text-right p-3 font-medium text-foreground">Momentum</th>
                          <th className="text-right p-3 font-medium text-foreground">Streak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamPerformance.map((member) => (
                          <tr key={member.user_id} className="border-t border-border hover:bg-muted/30">
                            <td className="p-3 text-muted-foreground">{member.rank}</td>
                            <td className="p-3 font-medium text-foreground">{member.full_name || 'Unknown'}</td>
                            <td className="p-3 text-right text-muted-foreground">{member.total_activities}</td>
                            <td className="p-3 text-right font-semibold text-foreground">{member.total_points.toLocaleString()}</td>
                            <td className="p-3 text-right">
                              <Badge variant={member.momentum_score >= 70 ? 'default' : 'secondary'}>
                                {member.momentum_score}
                              </Badge>
                            </td>
                            <td className="p-3 text-right text-muted-foreground">
                              {member.current_streak > 0 ? `🔥 ${member.current_streak}d` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
