import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, FileText, SendHorizonal, Loader2 } from 'lucide-react';
import TranscriptionView from './TranscriptionView';
import ChatInterface from './ChatInterface';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVideo } from '@/context/VideoContext';
import VoiceInput from './VoiceInput';

interface ContentTabsProps {
  currentVideoTime: number;
}

const ContentTabs: React.FC<ContentTabsProps> = ({ currentVideoTime }) => {
  const { sendChatMessage } = useVideo();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    const currentMessage = message;
    setMessage('');

    // Focus input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }

    try {
      await sendChatMessage(currentMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setMessage(transcript);
    // Optional: Automatically send the message after voice input
    if (transcript.trim() && !isLoading) {
      handleSendMessage(new Event('submit') as any);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col"
    >
      <Tabs
        defaultValue="chat"
        className="w-full h-full flex flex-col"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div className="px-2 border-b">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="chat" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="transcription" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Transcription
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 h-full overflow-hidden">
          <ChatInterface />
        </TabsContent>

        <TabsContent value="transcription" className="flex-1 h-full overflow-hidden">
          <TranscriptionView
            currentTime={currentVideoTime}
            isActive={activeTab === 'transcription'}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ContentTabs;
