import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { VideoInfo, Transcription, ChatMessage } from '@/lib/types';
import { useVideo } from './VideoContext';

interface Session {
  id: string;
  name: string;
  timestamp: number;
  videoInfo: VideoInfo | null;
  transcription: Transcription | null;
  chatMessages: ChatMessage[];
}

interface SessionContextType {
  sessions: Session[];
  currentSessionId: string | null;
  createNewSession: () => void;
  switchSession: (sessionId: string) => void;
  getCurrentSession: () => Session | null;
  updateCurrentSession: (data: Partial<Session>) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const videoContext = useVideo();

  const createNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: Session = {
      id: newSessionId,
      name: `Video ${sessions.length + 1}`,
      timestamp: Date.now(),
      videoInfo: null,
      transcription: null,
      chatMessages: []
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSessionId);
    videoContext.resetState();
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    videoContext.resetState();
  };

  const getCurrentSession = (): Session | null => {
    if (!currentSessionId) return null;
    return sessions.find(session => session.id === currentSessionId) || null;
  };

  const updateCurrentSession = (data: Partial<Session>) => {
    if (!currentSessionId) return;

    setSessions(prev => prev.map(session =>
      session.id === currentSessionId
        ? { ...session, ...data }
        : session
    ));
  };

  // Create initial session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  // Update session when video info changes
  useEffect(() => {
    if (videoContext.videoInfo && currentSessionId) {
      updateCurrentSession({
        videoInfo: videoContext.videoInfo,
        name: videoContext.videoInfo.title,
      });
    }
  }, [videoContext.videoInfo, currentSessionId]);

  // Update session when transcription changes
  useEffect(() => {
    if (videoContext.transcription && currentSessionId) {
      updateCurrentSession({ transcription: videoContext.transcription });
    }
  }, [videoContext.transcription, currentSessionId]);

  // Update session when chat messages change
  useEffect(() => {
    if (videoContext.chatMessages.length > 0 && currentSessionId) {
      updateCurrentSession({ chatMessages: videoContext.chatMessages });
    }
  }, [videoContext.chatMessages, currentSessionId]);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        currentSessionId,
        createNewSession,
        switchSession,
        getCurrentSession,
        updateCurrentSession
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
