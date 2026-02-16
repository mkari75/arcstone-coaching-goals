import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, XCircle } from 'lucide-react';
import { useApproveRevision } from '@/hooks/useGoals';
import { formatFieldValue, fieldDisplayNames } from '@/lib/validations/goals';
import type { PlanRevision } from '@/lib/types/goals';

interface RevisionApprovalModalProps {
  open: boolean;
  onClose: () => void;
  revision: PlanRevision;
}

export function RevisionApprovalModal({ open, onClose, revision }: RevisionApprovalModalProps) {
  const approveRevision = useApproveRevision();
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [managerNotes, setManagerNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (managerNotes.length < 200) {
      setError('Manager notes must be at least 200 characters');
      return;
    }
    await approveRevision.mutateAsync({
      revisionId: revision.id,
      decision,
      managerNotes,
    });
    setManagerNotes('');
    setDecision('approved');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Revision Request</DialogTitle>
          <DialogDescription>Evaluate the loan officer's request and provide your decision</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4">
            <div><span className="text-xs text-muted-foreground">Loan Officer</span><p className="text-sm font-medium text-foreground">{revision.requestedByName}</p></div>
            <div><span className="text-xs text-muted-foreground">Field</span><p className="text-sm font-medium text-foreground">{fieldDisplayNames[revision.fieldToChange] || revision.fieldToChange}</p></div>
            <div><span className="text-xs text-muted-foreground">Current Value</span><p className="text-sm font-medium text-foreground">{formatFieldValue(revision.fieldToChange, revision.currentValue)}</p></div>
            <div><span className="text-xs text-muted-foreground">Requested Value</span><p className="text-sm font-medium text-foreground">{formatFieldValue(revision.fieldToChange, revision.requestedValue)}</p></div>
            <div className="col-span-2"><span className="text-xs text-muted-foreground">Date</span><p className="text-sm text-foreground">{new Date(revision.requestedAt).toLocaleDateString()}</p></div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <span className="text-xs text-muted-foreground font-medium">Loan Officer's Justification</span>
            <p className="text-sm text-foreground mt-1">{revision.loJustification}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Decision</Label>
            <RadioGroup value={decision} onValueChange={(v) => setDecision(v as 'approved' | 'rejected')} className="space-y-2">
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="approved" id="approve" />
                <Label htmlFor="approve" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div><p className="text-sm font-medium">Approve</p><p className="text-xs text-muted-foreground">Accept the revision and update the business plan</p></div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="rejected" id="reject" />
                <Label htmlFor="reject" className="flex items-center gap-2 cursor-pointer flex-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <div><p className="text-sm font-medium">Reject</p><p className="text-xs text-muted-foreground">Decline the revision request with feedback</p></div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Manager Notes <span className="text-muted-foreground font-normal">(200-2000 characters)</span></Label>
            <Textarea
              value={managerNotes}
              onChange={(e) => { setManagerNotes(e.target.value); setError(''); }}
              rows={5}
              placeholder={decision === 'approved' ? 'Explain why you are approving this revision...' : 'Explain why you are rejecting this revision...'}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">{managerNotes.length} / 2000 characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={approveRevision.isPending}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={approveRevision.isPending || managerNotes.length < 200}
            variant={decision === 'approved' ? 'default' : 'destructive'}
          >
            {approveRevision.isPending ? 'Submitting...' : decision === 'approved' ? 'Approve Revision' : 'Reject Revision'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
