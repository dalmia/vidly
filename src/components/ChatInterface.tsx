import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideo } from '@/context/VideoContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Bot } from 'lucide-react';

const ChatInterface: React.FC = () => {
  const { status, chatMessages } = useVideo();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatMessages]);

  if (status !== 'ready') {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Add a video to start chatting</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4 h-full overflow-auto" ref={scrollAreaRef}>
      {chatMessages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center">
          <div className="max-w-xs">
            <p className="text-muted-foreground text-sm">
              Ask questions about the video content. Get insights, summaries, or explanations.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          <AnimatePresence>
            {chatMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''
                  }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : msg.isError
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-secondary'
                    }`}
                >
                  {msg.isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </ScrollArea>
  );
};

export default ChatInterface;
