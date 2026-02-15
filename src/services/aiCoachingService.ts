import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  totalContacts: number;
  activeContacts: number;
  activitiesLast30Days: number;
  callsLast30Days: number;
  emailsLast30Days: number;
  averageDailyCompletion: number;
  currentStreak: number;
  momentumScore: number;
}

interface ContactInsight {
  contactId: string;
  contactName: string;
  riskScore: number;
  daysSinceContact: number;
  recommendedAction: string;
}

export const aiCoachingService = {
  async analyzeUserPerformance(userId: string): Promise<any> {
    const cacheKey = `performance_analysis_${new Date().toISOString().split('T')[0]}`;

    const { data: cached } = await supabase
      .from('ai_analysis_cache')
      .select('result')
      .eq('user_id', userId)
      .eq('analysis_type', 'performance')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) return cached.result;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId);

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const { data: powerMoves } = await supabase
      .from('daily_power_moves')
      .select('*')
      .eq('user_id', userId)
      .gte('assigned_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const metrics: PerformanceMetrics = {
      totalContacts: contacts?.length || 0,
      activeContacts: contacts?.filter(c => c.health_status === 'healthy')?.length || 0,
      activitiesLast30Days: activities?.length || 0,
      callsLast30Days: activities?.filter(a => a.activity_type === 'call')?.length || 0,
      emailsLast30Days: activities?.filter(a => a.activity_type === 'email')?.length || 0,
      averageDailyCompletion: (powerMoves?.reduce((sum, pm) => sum + (pm.completion_percentage ?? 0), 0) ?? 0) / (powerMoves?.length || 1),
      currentStreak: profile?.current_streak || 0,
      momentumScore: profile?.momentum_score || 0,
    };

    const insights: any[] = [];

    if (metrics.activitiesLast30Days < 20) {
      insights.push({
        user_id: userId,
        insight_type: 'performance',
        title: 'Low Activity Alert',
        description: `You've logged ${metrics.activitiesLast30Days} activities in the last 30 days. Consider increasing your daily contact touchpoints.`,
        priority: 'high',
        category: 'activities',
        recommendations: [
          'Set a daily goal of 3-5 contact interactions',
          'Schedule focused outreach blocks in your calendar',
          'Use email templates to speed up communication',
        ],
      });
    }

    const atRiskCount = contacts?.filter(c => c.health_status === 'at_risk')?.length || 0;
    if (atRiskCount > 5) {
      insights.push({
        user_id: userId,
        insight_type: 'risk',
        title: 'Multiple At-Risk Contacts',
        description: `You have ${atRiskCount} contacts marked as at-risk. Immediate follow-up recommended.`,
        priority: 'critical',
        category: 'contacts',
        recommendations: [
          'Prioritize reaching out to at-risk contacts today',
          'Consider a re-engagement email campaign',
          'Schedule check-in calls with top prospects',
        ],
      });
    }

    if (metrics.currentStreak >= 7) {
      insights.push({
        user_id: userId,
        insight_type: 'opportunity',
        title: 'Excellent Momentum!',
        description: `You're on a ${metrics.currentStreak}-day streak! Keep up the great work.`,
        priority: 'medium',
        category: 'goals',
        recommendations: [
          'Challenge yourself to reach a 14-day streak',
          'Share your success with the team',
          'Maintain consistency with your Power Moves',
        ],
      });
    }

    for (const insight of insights) {
      await supabase.from('ai_coaching_insights').insert(insight);
    }

    const result = { metrics, insights };

    await supabase.from('ai_analysis_cache').upsert({
      user_id: userId,
      analysis_type: 'performance',
      cache_key: cacheKey,
      result: result as any,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    return result;
  },

  async identifyAtRiskContacts(userId: string): Promise<ContactInsight[]> {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, name, last_contact_date, health_status')
      .eq('user_id', userId)
      .in('health_status', ['at_risk', 'inactive']);

    const insights: ContactInsight[] = [];

    for (const contact of contacts || []) {
      const daysSinceContact = contact.last_contact_date
        ? Math.floor((Date.now() - new Date(contact.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let riskScore = 0;
      let recommendedAction = '';

      if (daysSinceContact > 30) riskScore += 0.5;
      if (daysSinceContact > 60) riskScore += 0.3;
      if (contact.health_status === 'inactive') riskScore += 0.2;

      if (daysSinceContact > 60) {
        recommendedAction = 'Urgent: Schedule immediate call to re-engage';
      } else if (daysSinceContact > 30) {
        recommendedAction = 'Send personalized check-in email';
      } else {
        recommendedAction = 'Schedule follow-up within next 7 days';
      }

      insights.push({
        contactId: contact.id,
        contactName: contact.name,
        riskScore: Math.min(riskScore, 1.0),
        daysSinceContact,
        recommendedAction,
      });

      await supabase.from('ai_recommendations').insert({
        user_id: userId,
        contact_id: contact.id,
        recommendation_type: daysSinceContact > 60 ? 'contact_now' : 'schedule_meeting',
        title: `Re-engage ${contact.name}`,
        description: `No contact in ${daysSinceContact} days. ${recommendedAction}`,
        confidence_score: riskScore,
        reasoning: `Contact has been inactive for ${daysSinceContact} days with health status: ${contact.health_status}`,
        suggested_action: {
          type: 'contact',
          contactId: contact.id,
          urgency: daysSinceContact > 60 ? 'high' : 'medium',
        },
      });
    }

    return insights.sort((a, b) => b.riskScore - a.riskScore);
  },

  async suggestPowerMoves(userId: string): Promise<string[]> {
    const { data: activities } = await supabase
      .from('activities')
      .select('activity_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const suggestions: string[] = [];
    const callCount = activities?.filter(a => a.activity_type === 'call')?.length || 0;
    const emailCount = activities?.filter(a => a.activity_type === 'email')?.length || 0;
    const meetingCount = activities?.filter(a => a.activity_type === 'meeting')?.length || 0;

    if (callCount < 10) suggestions.push('Make 3 prospecting calls today');
    if (emailCount < 20) suggestions.push('Send 5 personalized follow-up emails');
    if (meetingCount < 5) suggestions.push('Schedule 2 discovery meetings');

    suggestions.push('Update 5 contact records with latest information');
    suggestions.push('Review and respond to all pending inquiries');

    return suggestions.slice(0, 5);
  },

  async generateWeeklySummary(userId: string): Promise<string> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString());

    const { data: powerMoves } = await supabase
      .from('daily_power_moves')
      .select('*')
      .eq('user_id', userId)
      .gte('assigned_date', weekAgo.toISOString().split('T')[0]);

    const totalActivities = activities?.length || 0;
    const completedDays = powerMoves?.filter(pm => (pm.completion_percentage ?? 0) === 100)?.length || 0;
    const calls = activities?.filter(a => a.activity_type === 'call')?.length || 0;
    const emails = activities?.filter(a => a.activity_type === 'email')?.length || 0;

    const summary = `
Weekly Performance Summary:

📊 Activity Overview:
• Total activities: ${totalActivities}
• Phone calls: ${calls}
• Emails sent: ${emails}
• Days with completed Power Moves: ${completedDays}/7

${completedDays >= 5 ? '🎉 Excellent consistency this week!' : '💡 Aim for more consistent daily completion'}
${totalActivities < 20 ? '📈 Goal: Increase activity count to 30+ next week' : '✅ Great activity level!'}

🎯 Next Week Focus:
${calls < 10 ? '• Increase call volume (target: 15+ calls)' : ''}
${emails < 20 ? '• Send more personalized emails (target: 25+ emails)' : ''}
• Maintain or improve Power Move completion rate
• Focus on high-priority contacts
    `.trim();

    await supabase.from('activity_summaries').upsert({
      user_id: userId,
      period_type: 'weekly',
      period_start: weekAgo.toISOString(),
      period_end: new Date().toISOString(),
      summary_text: summary,
      highlights: [
        `${totalActivities} total activities`,
        `${completedDays}/7 days completed`,
      ],
      key_metrics: { totalActivities, calls, emails, completedDays },
      recommendations: [
        calls < 10 ? 'Increase call volume' : 'Maintain call consistency',
        emails < 20 ? 'Send more emails' : 'Keep email engagement strong',
      ],
    });

    return summary;
  },

  async predictPerformanceTrends(userId: string): Promise<any> {
    const { data: activities } = await supabase
      .from('activities')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!activities || activities.length < 10) {
      return { trend: 'insufficient_data', message: 'Not enough historical data for trend analysis' };
    }

    const weeklyActivity = new Map<string, number>();
    activities.forEach(activity => {
      const weekKey = new Date(activity.created_at!).toISOString().split('T')[0].slice(0, 8) + '01';
      weeklyActivity.set(weekKey, (weeklyActivity.get(weekKey) || 0) + 1);
    });

    const weeks = Array.from(weeklyActivity.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const recentWeeks = weeks.slice(-4);
    const avgRecent = recentWeeks.reduce((sum, [, count]) => sum + count, 0) / recentWeeks.length;
    const previousWeeks = weeks.slice(-8, -4);
    const avgPrevious = previousWeeks.reduce((sum, [, count]) => sum + count, 0) / (previousWeeks.length || 1);

    let trend = 'stable';
    let message = '';

    if (avgRecent > avgPrevious * 1.2) {
      trend = 'increasing';
      message = '📈 Your activity is trending upward! Keep up the momentum.';
    } else if (avgRecent < avgPrevious * 0.8) {
      trend = 'decreasing';
      message = '📉 Activity has declined recently. Consider re-focusing on daily goals.';
    } else {
      trend = 'stable';
      message = '➡️ Your activity is consistent. Challenge yourself to increase volume.';
    }

    return { trend, message, avgRecent, avgPrevious, weeklyData: weeks };
  },
};
