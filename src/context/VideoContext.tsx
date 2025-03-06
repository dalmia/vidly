import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VideoInfo, Transcription, ChatMessage, VideoStatus, VideoSection } from '@/lib/types';
import {
  fetchVideoInfo,
  extractAudio,
  startTranscription,
  createSections,
  answerQuestion
} from '@/lib/api';
import { toast } from 'sonner';

interface VideoContextType {
  videoInfo: VideoInfo | null;
  transcription: Transcription | null;
  sections: VideoSection[];
  chatMessages: ChatMessage[];
  status: VideoStatus;
  error: string | null;
  processVideoUrl: (url: string) => Promise<void>;
  sendChatMessage: (message: string, currentTimestamp?: number) => Promise<void>;
  resetState: () => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [sections, setSections] = useState<VideoSection[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<VideoStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setVideoInfo(null);
    setTranscription(null);
    setSections([]);
    setChatMessages([]);
    setStatus('idle');
    setError(null);
  };

  const processVideoUrl = async (url: string) => {
    try {
      // Set initial loading state
      setStatus('loading');
      setError(null);

      // Fetch video information
      console.log('Fetching video info...');
      const info = await fetchVideoInfo(url);
      setVideoInfo(info);
      console.log('Video info fetched:', info);

      // Step 1: Extract audio
      console.log('Starting audio extraction...');
      setStatus('extracting');
      await extractAudio(info.id);
      console.log('Audio extraction completed');

      // Step 2: Transcribe video
      console.log('Starting transcription...');
      setStatus('transcribing');
      await startTranscription(info.id);
      console.log('Transcription completed');

      // Step 3: Create sections
      console.log('Starting section creation...');
      setStatus('sectioning');
      const sectionsData = await createSections(info.id);
      console.log('Sections data received:', sectionsData);

      // Ensure we have valid sections data
      if (!Array.isArray(sectionsData)) {
        console.warn('Invalid sections data received, using empty array');
        setSections([]);
      } else {
        setSections(sectionsData);

        // Create a transcription object from the sections data
        const fullText = sectionsData.map(section => section.summary).join(' ');

        // Helper function to convert time string to seconds
        const timeToSeconds = (timeStr: string): number => {
          const parts = timeStr.split(':').map(part => parseInt(part, 10));
          if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
          } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
          }
          return 0;
        };

        const segments = sectionsData.map(section => ({
          text: section.title + ': ' + section.summary,
          start: timeToSeconds(section.start),
          end: timeToSeconds(section.end)
        }));

        setTranscription({
          segments,
          fullText
        });
        console.log('Transcription created from sections data');
      }

      console.log('Sections and transcription set in state');

      // Ready to chat
      setStatus('ready');
      toast.success('Video processed successfully!');
    } catch (err) {
      console.error('Error processing video:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error(err instanceof Error ? err.message : 'Failed to process video');
    }
  };

  const sendChatMessage = async (message: string, currentTimestamp?: number) => {
    if (!videoInfo || status !== 'ready') {
      toast.error('No active video to chat with');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Add a placeholder loading message
    const loadingMessageId = `assistant-loading-${Date.now()}`;
    const loadingMessage: ChatMessage = {
      id: loadingMessageId,
      role: 'assistant',
      content: '...',
      timestamp: Date.now(),
      isLoading: true
    };

    setChatMessages(prev => [...prev, loadingMessage]);

    try {
      // Format the timestamp to HH:MM:SS
      const formatTime = (timeInSeconds: number): string => {
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      };

      // Use current timestamp if available, otherwise default to "00:00:00"
      const timestamp = currentTimestamp ? formatTime(currentTimestamp) : "00:00:00";

      // Get AI response using the answer_question API
      const response = await answerQuestion(
        videoInfo.id,
        message,
        timestamp
      );

      // Replace the loading message with the actual response
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessageId
            ? {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: response,
              timestamp: Date.now()
            }
            : msg
        )
      );
    } catch (err) {
      console.error('Error chatting with video:', err);

      // Replace loading message with error message
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessageId
            ? {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: 'Sorry, I couldn\'t process your question. Please try again.',
              timestamp: Date.now(),
              isError: true
            }
            : msg
        )
      );

      toast.error('Failed to get a response');
    }
  };

  return (
    <VideoContext.Provider value={{
      videoInfo,
      transcription,
      sections,
      chatMessages,
      status,
      error,
      processVideoUrl,
      sendChatMessage,
      resetState
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = (): VideoContextType => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};
