import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useVideo } from '@/context/VideoContext';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

interface TranscriptionViewProps {
  currentTime?: number;
  isActive: boolean;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ currentTime = 0, isActive }) => {
  const { transcription, status } = useVideo();
  const [expandedSegment, setExpandedSegment] = useState<number | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastScrollTimeRef = useRef<number>(0);
  const lastActiveIndexRef = useRef<number | null>(null);

  // Find the active segment based on current time
  const findActiveSegmentIndex = useCallback((time: number) => {
    if (!transcription) return -1;

    return transcription.segments.findIndex((segment, index) => {
      // If it's the last segment
      if (index === transcription.segments.length - 1) {
        return time >= segment.start;
      }
      // For all other segments
      return time >= segment.start && time < transcription.segments[index + 1].start;
    });
  }, [transcription]);

  // Update active segment based on current time
  useEffect(() => {
    if (!transcription || !isActive) return;

    const newActiveIndex = findActiveSegmentIndex(currentTime);

    if (newActiveIndex !== -1 && newActiveIndex !== activeSegmentIndex) {
      setActiveSegmentIndex(newActiveIndex);

      // Only scroll if the active segment has changed significantly or after a delay
      const now = Date.now();
      if (
        (lastActiveIndexRef.current === null ||
          Math.abs(newActiveIndex - (lastActiveIndexRef.current || 0)) > 2) &&
        (now - lastScrollTimeRef.current > 1000)
      ) {
        // Scroll to the active segment with a small delay to avoid too frequent scrolling
        if (isActive && segmentRefs.current[newActiveIndex]) {
          setTimeout(() => {
            segmentRefs.current[newActiveIndex]?.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            lastScrollTimeRef.current = Date.now();
          }, 100);
        }
      }

      lastActiveIndexRef.current = newActiveIndex;
    }
  }, [currentTime, transcription, isActive, activeSegmentIndex, findActiveSegmentIndex]);

  // Reset refs when transcription changes
  useEffect(() => {
    if (transcription) {
      segmentRefs.current = segmentRefs.current.slice(0, transcription.segments.length);
      lastActiveIndexRef.current = null;
      setActiveSegmentIndex(null);
    }
  }, [transcription]);

  if (status !== 'ready' || !transcription) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Add a video to see transcription</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
        <div className="space-y-3">
          {transcription.segments.map((segment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * Math.min(index, 10) }}
              className="group"
              ref={el => segmentRefs.current[index] = el}
            >
              <div
                className={`p-3 rounded-lg border transition-all duration-200 ${activeSegmentIndex === index
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/40 hover:border-border'
                  }`}
                onClick={() => setExpandedSegment(expandedSegment === index ? null : index)}
              >
                <div className="flex justify-between items-start">
                  <p className={`text-sm leading-relaxed ${activeSegmentIndex === index ? 'font-medium' : ''
                    }`}>
                    {segment.text}
                  </p>
                  <span className="text-xs text-muted-foreground ml-2 mt-1">
                    {formatTime(segment.start)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranscriptionView;
