import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { VideoProvider } from '@/context/VideoContext';
import { SessionProvider } from '@/context/SessionContext';
import Header from '@/components/Header';
import VideoInput from '@/components/VideoInput';
import SessionSidebar from '@/components/SessionSidebar';
import ContentTabs from '@/components/ContentTabs';
import { useVideo } from '@/context/VideoContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizonal, Loader2 } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';
import YouTubePlayer from '@/components/YouTubePlayer';

const MainContent = () => {
  const { status, videoInfo, sendChatMessage } = useVideo();
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || status !== 'ready') return;

    setIsLoading(true);
    const currentMessage = message;
    setMessage('');

    // Focus input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }

    try {
      // Include instructions if available
      const messageWithInstructions = instructions.trim()
        ? `[Instructions: ${instructions}]\n\n${currentMessage}`
        : currentMessage;

      await sendChatMessage(messageWithInstructions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setMessage(transcript);
    // Optional: Automatically send the message after voice input
    if (transcript.trim() && !isLoading && status === 'ready') {
      handleSendMessage(new Event('submit') as any);
    }
  };

  const handleInstructionsVoiceInput = (transcript: string) => {
    setInstructions(prev => prev ? `${prev} ${transcript}` : transcript);
  };

  const handleVideoTimeUpdate = (currentTime: number) => {
    setCurrentVideoTime(currentTime);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header />

      <main className="flex-1 container py-6 px-4">
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center mb-8"
          >
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl font-medium tracking-tight mb-3"
            >
              Chat with any YouTube video
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-muted-foreground mb-8"
            >
              Paste a YouTube link and start talking
            </motion.p>

            <VideoInput />
          </motion.div>
        )}

        {(status === 'loading' || status === 'transcribing') && (
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full mx-auto"
            >
              <Button
                disabled={true}
                className="h-14 px-6"
              >
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {status === 'transcribing' ? 'Transcribing...' : 'Processing...'}
              </Button>

              {status === 'transcribing' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <p className="text-xs text-muted-foreground animate-pulse">
                    This may take a moment depending on video length...
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}

        {status === 'ready' && videoInfo && (
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col lg:flex-row lg:space-x-6 lg:space-y-0">
              {/* Video preview and Instructions */}
              <div className="w-full lg:w-1/2 flex flex-col space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full overflow-hidden"
                >
                  <YouTubePlayer
                    videoId={videoInfo.id}
                    title={videoInfo.title}
                    onTimeUpdate={handleVideoTimeUpdate}
                  />
                </motion.div>

                {/* Instructions for AI */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="w-full mt-4"
                >
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="instructions" className="text-sm font-medium">
                        Instructions for AI
                      </label>
                      <VoiceInput
                        onTranscript={handleInstructionsVoiceInput}
                        isDisabled={isLoading}
                      />
                    </div>
                    <textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="min-h-[150px] p-3 rounded-md border border-input bg-transparent text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Add specific instructions for the AI to follow when answering your questions..."
                    />
                  </div>
                </motion.div>
              </div>

              {/* Chat and Transcription tabs */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full lg:w-1/2 glass rounded-xl overflow-hidden lg:h-[calc(9/16*50vw+160px)]"
              >
                <ContentTabs currentVideoTime={currentVideoTime} />
              </motion.div>
            </div>

            {/* Full-width chat input that spans across columns */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-full"
            >
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask a question about the video..."
                    className="pr-10 h-12"
                    disabled={isLoading}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <VoiceInput
                      onTranscript={handleVoiceInput}
                      isDisabled={isLoading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="h-12 px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <SendHorizonal className="h-5 w-5" />
                  )}
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </motion.div>
          </div>
        )}

        {status === 'error' && (
          <div className="max-w-2xl mx-auto">
            <VideoInput />
          </div>
        )}
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <VideoProvider>
      <SessionProvider>
        <div className="min-h-screen flex">
          <SessionSidebar />
          <MainContent />
        </div>
      </SessionProvider>
    </VideoProvider>
  );
};

export default Index;
