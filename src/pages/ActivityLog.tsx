import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities, useContacts, useCreateActivity, useTodayStats, ACTIVITY_POINTS, ACTIVITY_LABELS } from '@/hooks/useActivities';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { transcribeAudio, uploadVoiceNote } from '@/services/whisperService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Users, MessageSquare, RefreshCw, Star, Mic, MicOff, Search, Activity, TrendingUp, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  phone_call: Phone, email: Mail, meeting: Users, text_message: MessageSquare, follow_up: RefreshCw, referral: Star,
};

const ActivityLog = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  // Form state
  const [contactId, setContactId] = useState('');
  const [activityType, setActivityType] = useState('');
  const [description, setDescription] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: contacts } = useContacts(userId);
  const { data: activities, isLoading } = useActivities(userId, {
    activityType: filterType || undefined,
    search: searchQuery || undefined,
  });
  const { data: todayStats } = useTodayStats(userId);
  const createActivity = useCreateActivity();
  const { recordingState, startRecording, stopRecording, resetRecording, audioLevel } = useAudioRecording();

  const handleStopAndTranscribe = async () => {
    await stopRecording();
    // Wait briefly for blob to be ready
    setTimeout(async () => {
      if (recordingState.audioBlob) {
        setIsTranscribing(true);
        try {
          const result = await transcribeAudio(recordingState.audioBlob);
          setTranscription(result.text);
          setDescription(prev => prev ? `${prev}\n\n[Voice Note]: ${result.text}` : result.text);
          toast.success('Transcription complete');
        } catch (e: any) {
          toast.error(e.message || 'Transcription failed');
        } finally {
          setIsTranscribing(false);
        }
      }
    }, 500);
  };

  const handleSubmit = async () => {
    if (!activityType || !userId) { toast.error('Select an activity type'); return; }

    const points = ACTIVITY_POINTS[activityType] || 0;
    try {
      const data = await createActivity.mutateAsync({
        user_id: userId,
        activity_type: activityType,
        activity_category: activityType === 'referral' ? 'relationship' : 'outreach',
        description: description || null,
        contact_id: contactId || null,
        points,
        status: 'completed',
        completed_at: new Date().toISOString(),
        transcription: transcription || null,
      });

      // Upload voice note if present
      if (recordingState.audioBlob && data?.id) {
        try {
          await uploadVoiceNote(recordingState.audioBlob, userId, data.id);
        } catch { /* non-blocking */ }
      }

      // Reset form
      setContactId(''); setActivityType(''); setDescription(''); setTranscription('');
      resetRecording();
      toast.success(`+${points} points earned!`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to log activity');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Activity Log</h1>
        <p className="text-muted-foreground mt-1">Track your daily outreach and earn points.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Activities</p>
              <p className="text-2xl font-bold text-foreground">{todayStats?.count ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--success))]/10"><TrendingUp className="h-5 w-5 text-[hsl(var(--success))]" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Points</p>
              <p className="text-2xl font-bold text-foreground">{todayStats?.totalPoints ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--info))]/10"><Clock className="h-5 w-5 text-[hsl(var(--info))]" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Type Breakdown</p>
              <div className="flex gap-1 flex-wrap mt-1">
                {todayStats?.breakdown && Object.entries(todayStats.breakdown).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="text-xs">{ACTIVITY_LABELS[type]?.slice(0, 5)}: {count}</Badge>
                ))}
                {(!todayStats?.breakdown || Object.keys(todayStats.breakdown).length === 0) && <span className="text-sm text-muted-foreground">No activities yet</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Entry Form */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Log Activity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger><SelectValue placeholder="Activity Type" /></SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label} (+{ACTIVITY_POINTS[val]}pts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger><SelectValue placeholder="Select Contact (optional)" /></SelectTrigger>
              <SelectContent>
                {contacts?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />

          {/* Voice recorder */}
          <div className="flex items-center gap-3">
            {!recordingState.isRecording ? (
              <Button variant="outline" size="sm" onClick={startRecording} disabled={isTranscribing}>
                <Mic className="h-4 w-4 mr-1" /> Record Voice Note
              </Button>
            ) : (
              <Button variant="destructive" size="sm" onClick={handleStopAndTranscribe}>
                <MicOff className="h-4 w-4 mr-1" /> Stop ({recordingState.duration}s)
              </Button>
            )}
            {recordingState.isRecording && (
              <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${audioLevel * 100}%` }} />
              </div>
            )}
            {isTranscribing && <span className="text-sm text-muted-foreground animate-pulse">Transcribing...</span>}
            {transcription && <Badge variant="secondary" className="text-xs">Transcribed ✓</Badge>}
          </div>

          <div className="flex justify-between items-center">
            {activityType && (
              <Badge className="bg-primary text-primary-foreground">+{ACTIVITY_POINTS[activityType]} points</Badge>
            )}
            <Button onClick={handleSubmit} disabled={!activityType || createActivity.isPending} className="ml-auto">
              {createActivity.isPending ? 'Logging...' : 'Log Activity'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search activities..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground text-center py-8">Loading activities...</p>}
        {!isLoading && activities?.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No activities yet. Log your first activity above!</CardContent></Card>
        )}
        {activities?.map(activity => {
          const Icon = ACTIVITY_ICONS[activity.activity_type] || Activity;
          const contactName = (activity as any).contacts?.name;
          const isExpanded = expandedId === activity.id;

          return (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{ACTIVITY_LABELS[activity.activity_type] || activity.activity_type}</span>
                        {contactName && <Badge variant="outline" className="text-xs">{contactName}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">+{activity.points ?? 0}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.completed_at ? format(new Date(activity.completed_at), 'MMM d, h:mm a') : ''}
                        </span>
                      </div>
                    </div>
                    {activity.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>}
                    {activity.transcription && (
                      <button onClick={() => setExpandedId(isExpanded ? null : activity.id)} className="flex items-center gap-1 text-xs text-primary mt-1 hover:underline">
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isExpanded ? 'Hide' : 'Show'} Transcription
                      </button>
                    )}
                    {isExpanded && activity.transcription && (
                      <div className="mt-2 p-3 bg-muted rounded-md text-sm text-muted-foreground">{activity.transcription}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityLog;
