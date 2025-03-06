
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVideo } from '@/context/VideoContext';
import { Youtube, ArrowRight, Loader2 } from 'lucide-react';

const VideoInput: React.FC = () => {
  const [inputUrl, setInputUrl] = useState('');
  const { processVideoUrl, status, error } = useVideo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      processVideoUrl(inputUrl.trim());
    }
  };

  const isLoading = status === 'loading' || status === 'transcribing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <Youtube className="h-5 w-5" />
            </div>

            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste a YouTube video URL"
              className={`pl-10 pr-4 h-14 glass hover-glass focus-within-glass transition-all duration-300 text-base ${error ? 'border-red-300 focus-visible:ring-red-300' : ''
                }`}
              disabled={isLoading}
            />

            {inputUrl && !isLoading && (
              <button
                type="button"
                onClick={() => setInputUrl('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="sr-only">Clear</span>
                <span aria-hidden="true">&times;</span>
              </button>
            )}
          </div>

          <Button
            type="submit"
            disabled={!inputUrl.trim() || isLoading}
            className="h-14 px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {status === 'transcribing' ? 'Transcribing...' : 'Processing...'}
              </>
            ) : (
              <>
                <span className="">Start</span>
              </>
            )}
          </Button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-red-500 text-sm mt-2 pl-2"
          >
            {error}
          </motion.p>
        )}

        {status === 'transcribing' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-6 left-0 w-full flex justify-center"
          >
            <p className="text-xs text-muted-foreground animate-pulse">
              This may take a moment depending on video length...
            </p>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};

export default VideoInput;
