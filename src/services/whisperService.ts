import { supabase } from '@/integrations/supabase/client';

export interface TranscriptionResult {
  text: string;
  duration: number;
  language?: string;
}

export interface ContactExtraction {
  contactName?: string;
  contactType?: string;
  confidence: number;
  rawMentions: string[];
}

export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Transcription failed' }));
    throw new Error(err.error || 'Transcription failed');
  }

  return response.json();
}

export async function extractContactFromTranscription(
  transcription: string,
  userContacts: Array<{ id: string; name: string; contact_type: string }>
): Promise<ContactExtraction> {
  try {
    const contactNames = userContacts.map(c => c.name).join(', ');
    const { data, error } = await supabase.functions.invoke('voice-transcribe', {
      body: { action: 'extract-contact', transcription, contactNames },
    });

    if (error) throw error;
    return {
      contactName: data.contactName || undefined,
      contactType: data.contactType || undefined,
      confidence: data.confidence || 0,
      rawMentions: data.rawMentions || [],
    };
  } catch (error) {
    console.error('Contact extraction error:', error);
    return { confidence: 0, rawMentions: [] };
  }
}

export async function uploadVoiceNote(audioBlob: Blob, userId: string, activityId: string): Promise<string> {
  const fileName = `${userId}/${activityId}.webm`;
  const { error } = await supabase.storage
    .from('voice-notes')
    .upload(fileName, audioBlob, { contentType: audioBlob.type, upsert: false });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from('voice-notes').getPublicUrl(fileName);
  return urlData.publicUrl;
}

export function calculateVoiceNotePoints(duration: number, hasContact: boolean, transcriptionLength: number): number {
  let basePoints = 15;
  const durationBonus = Math.min(Math.floor(duration / 60) * 2, 10);
  const contactBonus = hasContact ? 10 : 0;
  const detailBonus = transcriptionLength > 100 ? 5 : 0;
  return basePoints + durationBonus + contactBonus + detailBonus;
}
