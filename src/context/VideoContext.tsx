
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VideoInfo, Transcription, ChatMessage, VideoStatus } from '@/lib/types';
import { fetchVideoInfo, transcribeVideo, chatWithVideo } from '@/lib/api';
import { toast } from 'sonner';

interface VideoContextType {
  videoInfo: VideoInfo | null;
  transcription: Transcription | null;
  chatMessages: ChatMessage[];
  status: VideoStatus;
  error: string | null;
  processVideoUrl: (url: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  resetState: () => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<VideoStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setVideoInfo(null);
    setTranscription(null);
    setChatMessages([]);
    setStatus('idle');
    setError(null);
  };

  const processVideoUrl = async (url: string) => {
    try {
      setStatus('loading');
      setError(null);
      
      // Fetch video information
      const info = await fetchVideoInfo(url);
      setVideoInfo(info);
      
      // Start transcription
      setStatus('transcribing');
      const transcript = await transcribeVideo(info.id);
      setTranscription(transcript);
      
      // Ready to chat
      setStatus('ready');
      toast.success('Video transcribed successfully!');
    } catch (err) {
      console.error('Error processing video:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error(err instanceof Error ? err.message : 'Failed to process video');
    }
  };

  const sendChatMessage = async (message: string) => {
    if (!videoInfo || !transcription) {
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
    
    try {
      // Get AI response
      const response = await chatWithVideo(
        videoInfo.id, 
        transcription.fullText, 
        message
      );
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error chatting with video:', err);
      toast.error('Failed to get a response');
    }
  };

  return (
    <VideoContext.Provider value={{
      videoInfo,
      transcription,
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
