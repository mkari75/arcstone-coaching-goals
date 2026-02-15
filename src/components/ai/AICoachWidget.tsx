import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Sparkles, TrendingUp, AlertTriangle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { useAIInsights, useAIRecommendations, useAcknowledgeInsight, useGenerateInsights, useCompleteRecommendation, useDismissRecommendation } from '@/hooks/useAIInsights';
import { useAuth } from '@/hooks/useAuth';

export function AICoachWidget() {
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const { data: insights, isLoading } = useAIInsights(userId);
  const { data: recommendations } = useAIRecommendations(userId);
  const acknowledgeInsight = useAcknowledgeInsight();
  const generateInsights = useGenerateInsights(userId);
  const completeRecommendation = useCompleteRecommendation();
  const dismissRecommendation = useDismissRecommendation();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'low': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <Sparkles className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Coach
            </CardTitle>
            <CardDescription>Personalized insights and recommendations</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateInsights.mutate()}
            disabled={generateInsights.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${generateInsights.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading insights...</p>
        ) : (
          <div className="space-y-4">
            {/* Insights */}
            {insights && insights.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Key Insights</h4>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <div key={insight.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {getInsightIcon(insight.insight_type)}
                            <span className="font-medium text-sm truncate">{insight.title}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => acknowledgeInsight.mutate(insight.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                        {insight.recommendations && insight.recommendations.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium">Recommended Actions:</p>
                            <ul className="mt-1 space-y-0.5">
                              {(insight.recommendations as string[]).map((rec: string, idx: number) => (
                                <li key={idx} className="text-xs text-muted-foreground flex gap-1">
                                  <span>•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Smart Recommendations</h4>
                <div className="space-y-2">
                  {recommendations.slice(0, 5).map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-2 rounded-md border bg-card">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{rec.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{rec.description}</p>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary"
                          onClick={() => completeRecommendation.mutate(rec.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => dismissRecommendation.mutate(rec.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!insights || insights.length === 0) && (!recommendations || recommendations.length === 0) && (
              <div className="text-center py-6">
                <Brain className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No active insights</p>
                <p className="text-xs text-muted-foreground mt-1">Click Refresh to generate new coaching insights</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
