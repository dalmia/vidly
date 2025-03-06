import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, FileText } from 'lucide-react';
import TranscriptionView from './TranscriptionView';
import ChatInterface from './ChatInterface';
import { useVideo } from '@/context/VideoContext';

interface ContentTabsProps {
  currentVideoTime: number;
}

const ContentTabs: React.FC<ContentTabsProps> = ({ currentVideoTime }) => {
  const [activeTab, setActiveTab] = useState('chat');

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
              Sections
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 overflow-hidden h-full">
          <ChatInterface />
        </TabsContent>

        <TabsContent value="transcription" className="flex-1 overflow-hidden h-full">
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
