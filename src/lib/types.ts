
export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}

export interface Transcription {
  segments: TranscriptionSegment[];
  fullText: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type VideoStatus = 'idle' | 'loading' | 'transcribing' | 'ready' | 'error';
