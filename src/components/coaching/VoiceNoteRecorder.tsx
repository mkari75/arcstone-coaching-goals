import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Square, Pause, Play, RotateCcw, Send, Loader2, Sparkles, User, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { transcribeAudio, extractContactFromTranscription, uploadVoiceNote, calculateVoiceNotePoints } from '@/services/whisperService';
import { useContacts, useCreateActivity } from '@/hooks/useActivities';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;

interface VoiceNoteRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  preSelectedContactId?: string;
}

interface ProcessingStep {
  step: 'transcribing' | 'extracting' | 'uploading' | 'saving' | 'complete';
  message: string;
}

export function VoiceNoteRecorder({ isOpen, onClose, userId, preSelectedContactId }: VoiceNoteRecorderProps) {
  const { data: contacts } = useContacts(userId);
  const createActivityMutation = useCreateActivity();

  const { recordingState, startRecording, stopRecording, pauseRecording, resumeRecording, resetRecording, audioLevel } = useAudioRecording(300);

  const [selectedContactId, setSelectedContactId] = useState<string | undefined>(preSelectedContactId);
  const [activityType, setActivityType] = useState('call');
  const [description, setDescription] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(null);
  const [suggestedContact, setSuggestedContact] = useState<Contact | null>(null);
  const [extractedPoints, setExtractedPoints] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTranscribedRef = useRef(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      resetRecording();
      setSelectedContactId(preSelectedContactId);
      setActivityType('call');
      setDescription('');
      setTranscription('');
      setSuggestedContact(null);
      setExtractedPoints(0);
      hasTranscribedRef.current = false;
    }
  }, [isOpen, preSelectedContactId]);

  // Auto-transcribe after recording stops
  useEffect(() => {
    if (recordingState.audioBlob && !recordingState.isRecording && !isProcessing && !hasTranscribedRef.current) {
      hasTranscribedRef.current = true;
      handleTranscribe();
    }
  }, [recordingState.audioBlob, recordingState.isRecording]);

  const handleTranscribe = async () => {
    if (!recordingState.audioBlob) return;
    setIsProcessing(true);
    setProcessingStep({ step: 'transcribing', message: 'Transcribing audio...' });

    try {
      const transcriptionResult = await transcribeAudio(recordingState.audioBlob);
      setTranscription(transcriptionResult.text);

      setProcessingStep({ step: 'extracting', message: 'Analyzing contacts...' });
      const extraction = await extractContactFromTranscription(
        transcriptionResult.text,
        contacts?.map(c => ({ id: c.id, name: c.name, contact_type: c.contact_type })) || []
      );

      if (extraction.contactName && extraction.confidence > 60 && contacts) {
        const matchedContact = contacts.find(
          c => c.name.toLowerCase().includes(extraction.contactName!.toLowerCase()) ||
               extraction.contactName!.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchedContact) {
          setSuggestedContact(matchedContact);
          setSelectedContactId(matchedContact.id);
        }
      }

      const points = calculateVoiceNotePoints(recordingState.duration, !!extraction.contactName, transcriptionResult.text.length);
      setExtractedPoints(points);
      setProcessingStep({ step: 'complete', message: 'Ready to save!' });
      toast.success('Transcription complete! Review and save your activity.');
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast.error(error.message || 'Transcription failed. Enter notes manually.');
      setTranscription('');
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const handleSave = async () => {
    if (!recordingState.audioBlob) { toast.error('Please record a voice note first.'); return; }
    if (!description && !transcription) { toast.error('Please add a description or transcription.'); return; }

    setIsProcessing(true);
    try {
      setProcessingStep({ step: 'uploading', message: 'Uploading voice note...' });
      const tempActivityId = `temp-${Date.now()}`;
      const voiceNoteUrl = await uploadVoiceNote(recordingState.audioBlob, userId, tempActivityId);

      setProcessingStep({ step: 'saving', message: 'Saving activity...' });
      await createActivityMutation.mutateAsync({
        user_id: userId,
        contact_id: selectedContactId || null,
        activity_type: 'voice_note',
        activity_category: 'growth',
        description: description || transcription,
        voice_note_url: voiceNoteUrl,
        transcription: transcription || null,
        points: extractedPoints,
        impact_level: selectedContactId ? 'high' : 'medium',
        status: 'completed',
        completed_at: new Date().toISOString(),
        device_info: { duration: recordingState.duration, platform: navigator.platform },
      });

      toast.success(`Voice note saved! You earned ${extractedPoints} points! 🎉`);
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Mic className="w-5 h-5 text-destructive" /> Record Voice Note
          </DialogTitle>
          <DialogDescription>Record an activity note. AI will transcribe and extract contacts automatically.</DialogDescription>
        </DialogHeader>

        {/* Processing overlay */}
        {isProcessing && processingStep && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="font-medium text-foreground">{processingStep.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {processingStep.step === 'transcribing' && 'Using AI to transcribe your voice note...'}
              {processingStep.step === 'extracting' && 'Identifying contacts mentioned...'}
              {processingStep.step === 'uploading' && 'Uploading audio file...'}
              {processingStep.step === 'saving' && 'Saving activity and updating points...'}
            </p>
          </div>
        )}

        {!isProcessing && (
          <div className="space-y-4">
            {/* Recording section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Recording</Label>

              {!recordingState.isRecording && !recordingState.audioBlob && (
                <Button onClick={startRecording} className="w-full bg-destructive hover:bg-destructive/90" size="lg">
                  <Mic className="w-5 h-5 mr-2" /> Start Recording
                </Button>
              )}

              {recordingState.isRecording && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', recordingState.isPaused ? 'bg-warning' : 'bg-destructive animate-pulse')} />
                    <span className="text-2xl font-display font-bold text-foreground">{formatDuration(recordingState.duration)}</span>
                    <span className="text-xs text-muted-foreground">/ {formatDuration(300)}</span>
                  </div>

                  {/* Audio level visualization */}
                  <div className="flex items-center justify-center gap-0.5 h-8">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-primary transition-all duration-75"
                        style={{ height: `${Math.max(4, audioLevel * (Math.random() * 24 + 8))}px` }}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {recordingState.isPaused ? (
                      <Button onClick={resumeRecording} variant="outline" className="flex-1">
                        <Play className="w-4 h-4 mr-2" /> Resume
                      </Button>
                    ) : (
                      <Button onClick={pauseRecording} variant="outline" className="flex-1">
                        <Pause className="w-4 h-4 mr-2" /> Pause
                      </Button>
                    )}
                    <Button onClick={stopRecording} variant="destructive" className="flex-1">
                      <Square className="w-4 h-4 mr-2" /> Stop
                    </Button>
                  </div>
                </div>
              )}

              {recordingState.audioBlob && !recordingState.isRecording && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <Volume2 className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <audio ref={audioRef} src={recordingState.audioUrl || undefined} controls className="w-full h-8" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: {formatDuration(recordingState.duration)} · Size: {(recordingState.audioBlob.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => { resetRecording(); setTranscription(''); setSuggestedContact(null); hasTranscribedRef.current = false; }} variant="outline" size="sm" className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" /> Record Again
                  </Button>
                </div>
              )}
            </div>

            {/* AI suggested contact */}
            {suggestedContact && (
              <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-info" /> AI detected contact mention
                </p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{suggestedContact.name}</span>
                  <span className="text-xs text-muted-foreground">{suggestedContact.contact_type.replace('_', ' ')}</span>
                </div>
              </div>
            )}

            {/* Transcription */}
            {transcription && (
              <div>
                <Label className="text-sm font-medium">AI Transcription</Label>
                <p className="text-sm text-muted-foreground mt-1 p-3 rounded-lg bg-muted italic">"{transcription}"</p>
              </div>
            )}

            {/* Contact select */}
            <div>
              <Label className="text-sm font-medium">Contact (Optional)</Label>
              <Select value={selectedContactId || ''} onValueChange={(val) => setSelectedContactId(val || undefined)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="No contact" /></SelectTrigger>
                <SelectContent>
                  {contacts?.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} - {contact.contact_type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activity type */}
            <div>
              <Label className="text-sm font-medium">Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select Activity Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium">Additional Notes (Optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add any additional context..." className="mt-1" rows={3} />
            </div>

            {/* Points preview */}
            {extractedPoints > 0 && (
              <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <Sparkles className="w-5 h-5 text-warning" />
                <span className="text-sm text-foreground">You'll earn</span>
                <Badge className="bg-warning text-white text-lg font-bold px-3 py-1">{extractedPoints} points</Badge>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={isProcessing || (!recordingState.audioBlob)} className="flex-1">
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Send className="w-4 h-4 mr-2" /> Save Activity</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
