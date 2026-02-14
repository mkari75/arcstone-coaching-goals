import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { MessageSquare, Plus, Calendar, Lock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCoachingNotes, useCreateCoachingNote, useDeleteCoachingNote } from '@/hooks/useCoachingNotes';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const noteTypeLabels: Record<string, string> = {
  one_on_one: '1:1 Meeting',
  feedback: 'Feedback',
  pip: 'PIP Note',
  observation: 'Observation',
  goal_setting: 'Goal Setting',
};

export function CoachingNotes({ loanOfficerId, loName }: { loanOfficerId: string; loName?: string }) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { data: notes, isLoading } = useCoachingNotes(loanOfficerId);
  const createMutation = useCreateCoachingNote();
  const deleteMutation = useDeleteCoachingNote();

  const [showDialog, setShowDialog] = useState(false);
  const [noteType, setNoteType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  const handleCreate = async () => {
    if (!userId || !content.trim()) return;
    await createMutation.mutateAsync({
      coach_id: userId,
      loan_officer_id: loanOfficerId,
      note_type: noteType,
      subject: subject || undefined,
      content: content.trim(),
      is_private: isPrivate,
      requires_follow_up: requiresFollowUp,
      follow_up_date: followUpDate || undefined,
    });
    setShowDialog(false);
    setSubject('');
    setContent('');
    setIsPrivate(false);
    setRequiresFollowUp(false);
    setFollowUpDate('');
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Coaching Notes {loName && <span className="text-muted-foreground font-normal">· {loName}</span>}
            </CardTitle>
            <Button size="sm" onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : !notes?.length ? (
            <p className="text-muted-foreground text-center py-8">No coaching notes yet.</p>
          ) : (
            notes.map(note => (
              <div key={note.id} className="p-3 rounded-lg border space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {noteTypeLabels[note.note_type] || note.note_type}
                    </Badge>
                    {note.is_private && <Lock className="w-3 h-3 text-muted-foreground" />}
                    {note.requires_follow_up && !note.follow_up_completed && (
                      <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        Follow-up
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at!), { addSuffix: true })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteMutation.mutate(note.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {note.subject && <p className="font-medium text-sm text-foreground">{note.subject}</p>}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Coaching Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(noteTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject (optional)</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief subject line..." />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your coaching note..."
                className="min-h-[120px]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                <Label className="text-sm">Private note</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={requiresFollowUp} onCheckedChange={setRequiresFollowUp} />
                <Label className="text-sm">Requires follow-up</Label>
              </div>
            </div>
            {requiresFollowUp && (
              <div>
                <Label>Follow-up Date</Label>
                <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!content.trim() || createMutation.isPending}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
