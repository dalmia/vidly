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

export interface VideoSection {
  title: string;
  summary: string[];
  start: string; // hh:mm:ss
  end: string; // hh:mm:ss
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isLoading?: boolean;
  isError?: boolean;
}

export type VideoStatus = 'idle' | 'loading' | 'extracting' | 'transcribing' | 'sectioning' | 'ready' | 'error';
