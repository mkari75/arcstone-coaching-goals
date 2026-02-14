import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
}

export interface UseAudioRecordingReturn {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  audioLevel: number;
}

export function useAudioRecording(maxDuration: number = 300): UseAudioRecordingReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false, isPaused: false, duration: 0, audioBlob: null, audioUrl: null, error: null,
  });
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(Math.min(average / 128, 1));
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordingState(prev => ({ ...prev, isRecording: false, audioBlob, audioUrl }));
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      setRecordingState(prev => ({ ...prev, isRecording: true, isPaused: false, duration: 0, error: null }));

      timerRef.current = setInterval(() => {
        setRecordingState(prev => {
          if (prev.isPaused) return prev;
          const newDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          if (newDuration >= maxDuration) { stopRecording(); return { ...prev, duration: maxDuration }; }
          return { ...prev, duration: newDuration };
        });
      }, 1000);

      updateAudioLevel();
    } catch (error: any) {
      console.error('Error starting recording:', error);
      setRecordingState(prev => ({ ...prev, error: error.message || 'Failed to start recording' }));
    }
  }, [maxDuration, stopRecording, updateAudioLevel]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording && !recordingState.isPaused) {
      mediaRecorderRef.current.pause();
      setRecordingState(prev => ({ ...prev, isPaused: true }));
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setAudioLevel(0);
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording && recordingState.isPaused) {
      mediaRecorderRef.current.resume();
      setRecordingState(prev => ({ ...prev, isPaused: false }));
      updateAudioLevel();
    }
  }, [recordingState.isRecording, recordingState.isPaused, updateAudioLevel]);

  const resetRecording = useCallback(() => {
    if (recordingState.audioUrl) URL.revokeObjectURL(recordingState.audioUrl);
    setRecordingState({ isRecording: false, isPaused: false, duration: 0, audioBlob: null, audioUrl: null, error: null });
    audioChunksRef.current = [];
    setAudioLevel(0);
  }, [recordingState.audioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { recordingState, startRecording, stopRecording, pauseRecording, resumeRecording, resetRecording, audioLevel };
}
