import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VideoProvider } from '@/context/VideoContext';
import { SessionProvider } from '@/context/SessionContext';
import { VoiceProvider, useVoice } from '@/context/VoiceContext';
import Header from '@/components/Header';
import VideoInput from '@/components/VideoInput';
import SessionSidebar from '@/components/SessionSidebar';
import ContentTabs from '@/components/ContentTabs';
import { useVideo } from '@/context/VideoContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizonal, Loader2 } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';
import VoiceModal from '@/components/VoiceModal';
import YouTubePlayer from '@/components/YouTubePlayer';

const MainContent = () => {
  const { status, videoInfo, sendChatMessage } = useVideo();
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to match the heights of the two columns
    const matchColumnHeights = () => {
      if (leftColumnRef.current && rightColumnRef.current) {
        const leftHeight = leftColumnRef.current.offsetHeight;
        rightColumnRef.current.style.height = `${leftHeight}px`;
      }
    };

    // Call initially and on window resize
    matchColumnHeights();
    window.addEventListener('resize', matchColumnHeights);

    // Clean up
    return () => {
      window.removeEventListener('resize', matchColumnHeights);
    };
  }, [status, videoInfo]);

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

      // Pass the current video time as a parameter to sendChatMessage
      await sendChatMessage(messageWithInstructions, currentVideoTime);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    console.log("Voice input for chat received:", transcript);
    setMessage(transcript);
    // Optional: Automatically send the message after voice input
    if (transcript.trim() && !isLoading && status === 'ready') {
      handleSendMessage(new Event('submit') as any);
    }
  };

  const handleInstructionsVoiceInput = (transcript: string) => {
    console.log("Voice input for instructions received:", transcript);
    setInstructions(prev => prev ? `${prev} ${transcript}` : transcript);
  };

  const handleVideoTimeUpdate = (currentTime: number) => {
    setCurrentVideoTime(currentTime);
  };

  // Define processing states
  const isProcessing = status === 'loading' || status === 'extracting' || status === 'transcribing' || status === 'sectioning';
  const isInitialState = status === 'idle' || status === 'error';

  return (
    <div className="flex-1 flex flex-col">
      <Header />

      <main className="flex-1 container py-2 px-4">
        {/* Initial state with form input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-4"
        >
          {isInitialState && (
            <>
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
            </>
          )}

          {/* Always show the VideoInput component */}
          {(isInitialState || isProcessing) && (
            <VideoInput />
          )}
        </motion.div>

        {/* Content when video is ready */}
        {status === 'ready' && videoInfo && (
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col lg:flex-row lg:space-x-6 lg:space-y-0 lg:min-h-[560px]">
              {/* Video preview and Instructions */}
              <div
                ref={leftColumnRef}
                className="w-full lg:w-1/2 flex flex-col space-y-3"
              >
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
                  className="w-full mt-2"
                >
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="instructions" className="text-sm font-medium">
                        Instructions for AI
                      </label>
                    </div>
                    <div className="relative">
                      <textarea
                        id="instructions"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="min-h-[120px] p-3 pr-10 w-full rounded-md border border-input bg-transparent text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Add custom instructions on how AI should respond"
                      />
                      <div className="absolute right-2 top-3">
                        <VoiceInput
                          onTranscript={handleInstructionsVoiceInput}
                          isDisabled={isLoading}
                          variant="secondary"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Chat and Transcription tabs */}
              <motion.div
                ref={rightColumnRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full lg:w-1/2 overflow-hidden flex flex-col"
              >
                <div className="flex-1 overflow-hidden">
                  <ContentTabs currentVideoTime={currentVideoTime} />
                </div>
              </motion.div>
            </div>

            {/* Full-width chat input that spans across columns */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-full mt-4"
            >
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <form onSubmit={handleSendMessage} className="w-full" onClick={(e) => e.stopPropagation()}>
                    <Input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask a question about the video"
                      className="pr-10 h-12 w-full"
                      disabled={isLoading}
                    />
                  </form>
                  <div
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <VoiceInput
                      onTranscript={handleVoiceInput}
                      isDisabled={isLoading}
                      variant="secondary"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleSendMessage}
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
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

// Add a GlobalVoiceModal component that will be rendered once
const GlobalVoiceModal = () => {
  const { isModalOpen, closeVoiceModal, currentCallback } = useVoice();

  const handleTranscript = (transcript: string) => {
    if (currentCallback) {
      currentCallback(transcript);
    }
  };

  return (
    <VoiceModal
      isOpen={isModalOpen}
      onClose={closeVoiceModal}
      onTranscript={handleTranscript}
    />
  );
};

const Index = () => {
  return (
    <VideoProvider>
      <SessionProvider>
        <VoiceProvider>
          <div className="min-h-screen flex">
            <SessionSidebar />
            <MainContent />
          </div>
          <GlobalVoiceModal />
        </VoiceProvider>
      </SessionProvider>
    </VideoProvider>
  );
};

export default Index;
