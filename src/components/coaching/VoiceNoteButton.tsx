import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { useAuth } from '@/hooks/useAuth';

interface VoiceNoteButtonProps {
  className?: string;
  variant?: 'fab' | 'inline';
}

export function VoiceNoteButton({ className, variant = 'fab' }: VoiceNoteButtonProps) {
  const { session } = useAuth();
  const [showRecorder, setShowRecorder] = useState(false);

  if (!session?.user?.id) return null;

  return (
    <>
      {variant === 'fab' ? (
        <button
          onClick={() => setShowRecorder(true)}
          className={cn(
            'fixed bottom-6 right-6 z-40',
            'w-16 h-16 rounded-full shadow-lg',
            'bg-destructive hover:bg-destructive/90',
            'flex items-center justify-center',
            'transition-all duration-200 hover:scale-110',
            'focus:outline-none focus:ring-4 focus:ring-destructive/30',
            className
          )}
          aria-label="Record voice note"
        >
          <Mic className="w-7 h-7 text-white" />
        </button>
      ) : (
        <Button onClick={() => setShowRecorder(true)} className={cn('bg-destructive hover:bg-destructive/90', className)} size="lg">
          <Mic className="w-5 h-5 mr-2" /> Record Voice Note
        </Button>
      )}

      <VoiceNoteRecorder
        isOpen={showRecorder}
        onClose={() => setShowRecorder(false)}
        userId={session.user.id}
      />
    </>
  );
}
