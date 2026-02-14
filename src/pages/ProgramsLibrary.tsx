import { useState } from 'react';
import { usePrograms, usePolicies, usePendingAcknowledgments } from '@/hooks/useProgramsAndPolicies';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Shield, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const ProgramsLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const { data: programs, isLoading: programsLoading } = usePrograms('active');
  const { data: policies, isLoading: policiesLoading } = usePolicies('active');
  const { data: pending } = usePendingAcknowledgments();

  const pendingIds = new Set((pending ?? []).map((p: any) => p.item_id));

  const allItems = [
    ...(programs || []).map(p => ({
      id: p.id,
      title: p.program_name,
      description: p.program_summary,
      category: p.program_type,
      effectiveDate: p.published_at,
      type: 'program' as const,
      hasQuiz: p.has_quiz,
      viewCount: p.view_count,
      acknowledgmentCount: p.acknowledgment_count,
      isPending: pendingIds.has(p.id),
    })),
    ...(policies || []).map(p => ({
      id: p.id,
      title: p.policy_name,
      description: p.policy_content?.substring(0, 200) || '',
      category: p.policy_type,
      effectiveDate: p.effective_date,
      type: 'policy' as const,
      hasQuiz: p.has_quiz,
      viewCount: p.view_count,
      acknowledgmentCount: p.acknowledgment_count,
      isPending: pendingIds.has(p.id),
    })),
  ];

  const filteredItems = allItems.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: allItems.length,
    programs: programs?.length || 0,
    policies: policies?.length || 0,
    pendingCount: pending?.length || 0,
  };

  const isLoading = programsLoading || policiesLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Programs & Policies</h1>
        <p className="text-muted-foreground mt-1">Access company programs, policies, and compliance materials</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.programs}</p>
            <p className="text-xs text-muted-foreground">Programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary-foreground">{stats.policies}</p>
            <p className="text-xs text-muted-foreground">Policies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Banner */}
      {stats.pendingCount > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-sm text-foreground">
                You have {stats.pendingCount} item{stats.pendingCount > 1 ? 's' : ''} requiring acknowledgment
              </p>
              <p className="text-xs text-muted-foreground">Please review and acknowledge pending items</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search programs and policies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="program">Programs ({stats.programs})</TabsTrigger>
          <TabsTrigger value="policy">Policies ({stats.policies})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No items found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map(item => (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                  onClick={() => navigate(item.type === 'program' ? `/programs/${item.id}` : `/policies/${item.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant={item.type === 'program' ? 'default' : 'secondary'}>
                        {item.type === 'program' ? (
                          <><FileText className="h-3 w-3 mr-1" /> Program</>
                        ) : (
                          <><Shield className="h-3 w-3 mr-1" /> Policy</>
                        )}
                      </Badge>
                      <Badge variant="outline">{item.category}</Badge>
                      {item.isPending && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Pending
                        </Badge>
                      )}
                      {item.hasQuiz && (
                        <Badge variant="outline" className="text-xs">Quiz</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {item.effectiveDate
                        ? `Effective ${format(new Date(item.effectiveDate), 'MMM d, yyyy')}`
                        : 'No date set'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgramsLibrary;
