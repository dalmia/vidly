import React from 'react';
import { motion } from 'framer-motion';
import { useSession } from '@/context/SessionContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';

const SessionSidebar: React.FC = () => {
  const { sessions, currentSessionId, createNewSession, switchSession } = useSession();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-64 border-r h-screen bg-slate-50"
    >
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <MessageSquare className="h-6 w-6" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-xl font-medium tracking-tight"
          >
            Vidly
          </motion.h1>
        </div>
      </div>

      <div className="p-3">
        <Button
          onClick={createNewSession}
          className="w-full justify-start"
          size="sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Video
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)] p-3">
        <div className="space-y-2">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant={currentSessionId === session.id ? "secondary" : "ghost"}
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => switchSession(session.id)}
              >
                <div className="flex flex-col items-start text-left">
                  <div className="flex items-center w-full">
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{session.videoInfo ? session.videoInfo.title : session.name}</span>
                  </div>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{format(session.timestamp, 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

export default SessionSidebar;
