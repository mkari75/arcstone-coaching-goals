import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TeamOverview } from '@/components/manager/TeamOverview';
import { TeamAlerts } from '@/components/manager/TeamAlerts';
import { CoachingNotes } from '@/components/manager/CoachingNotes';
import { useTeamMembers } from '@/hooks/useManagerDashboard';
import { Shield, Users, AlertTriangle, MessageSquare } from 'lucide-react';

const ManagerDashboard = () => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { data: teamMembers } = useTeamMembers();

  const selectedMember = teamMembers?.find(m => m.user_id === selectedMemberId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Manager Dashboard</h1>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="coaching" className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            Coaching
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <TeamOverview onSelectMember={setSelectedMemberId} />
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <TeamAlerts />
        </TabsContent>

        <TabsContent value="coaching" className="mt-4">
          {selectedMemberId ? (
            <CoachingNotes
              loanOfficerId={selectedMemberId}
              loName={selectedMember?.full_name || undefined}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground text-center py-4">
                Select a team member from the Team tab to view their coaching notes.
              </p>
              {teamMembers?.map(member => (
                <button
                  key={member.user_id}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedMemberId(member.user_id)}
                >
                  <p className="font-medium text-sm">{member.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerDashboard;
