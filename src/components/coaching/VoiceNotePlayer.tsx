import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Activity = Tables<'activities'>;

interface VoiceNotePlayerProps {
  activity: Activity;
  className?: string;
}

export function VoiceNotePlayer({ activity, className }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!activity.voice_note_url) return null;

  return (
    <Card className={cn('p-4', className)}>
      <audio ref={audioRef} src={activity.voice_note_url} preload="metadata" />

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={togglePlay} className="shrink-0">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Mic className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs text-muted-foreground">
              {activity.completed_at ? format(new Date(activity.completed_at), 'MMM d, h:mm a') : 'Voice Note'}
            </span>
            {activity.points && <Badge variant="secondary" className="text-xs">{activity.points} pts</Badge>}
          </div>

          <div className="w-full bg-secondary rounded-full h-1.5 cursor-pointer" onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pos * duration;
          }}>
            <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={toggleMute} className="shrink-0">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>

      {activity.transcription && (
        <p className="text-xs text-muted-foreground mt-2 italic">"{activity.transcription}"</p>
      )}
    </Card>
  );
}
