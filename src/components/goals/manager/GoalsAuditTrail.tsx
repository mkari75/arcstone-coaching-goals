import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import type { AuditEntry } from '@/lib/types/goals';

interface GoalsAuditTrailProps {
  entries: AuditEntry[];
}

const actionIcons: Record<string, typeof CheckCircle> = {
  created: FileText,
  revised: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

const actionColors: Record<string, string> = {
  created: 'bg-blue-100 text-blue-800',
  revised: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export function GoalsAuditTrail({ entries }: GoalsAuditTrailProps) {
  if (!entries.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No audit entries yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Goals Audit Trail</CardTitle>
        <CardDescription>Complete history of plan changes and approvals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => {
            const Icon = actionIcons[entry.action] || FileText;
            return (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <div className="mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{entry.details}</span>
                    <Badge className={actionColors[entry.action] || 'bg-secondary text-secondary-foreground'}>
                      {entry.action}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>LO: {entry.loanOfficer}</span>
                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                    {entry.approvedBy && <span>By: {entry.approvedBy}</span>}
                  </div>
                  {entry.loJustification && (
                    <p className="text-xs text-muted-foreground mt-1 italic">"{entry.loJustification}"</p>
                  )}
                  {entry.managerNotes && (
                    <p className="text-xs text-foreground mt-1">Manager: {entry.managerNotes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
