import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useVideo } from '@/context/VideoContext';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ChevronRight, ChevronDown } from 'lucide-react';

// Add type declaration for YouTube API
declare global {
  interface Window {
    YT: any;
  }
}

// Accepts either a number in seconds or a string in HH:MM:SS format
const formatTime = (time: number | string): string => {
  let seconds: number;

  // Handle string format (HH:MM:SS or MM:SS)
  if (typeof time === 'string') {
    // Remove any quotes if present
    const cleanTime = time.replace(/"/g, '');
    const parts = cleanTime.split(':').map(part => parseInt(part, 10));

    if (parts.length === 3) {
      // HH:MM:SS format
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS format
      seconds = parts[0] * 60 + parts[1];
    } else {
      seconds = parseInt(cleanTime, 10) || 0;
    }
  } else {
    seconds = time || 0;
  }

  // Handle NaN or invalid values
  if (isNaN(seconds) || seconds === undefined || seconds === null) {
    return "00:00";
  }

  // Convert to hours, minutes, seconds
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  // Format with leading zeros
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  // Include hours only if >= 1 hour
  if (hours > 0) {
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  // Just return minutes:seconds if less than 1 hour
  return `${formattedMinutes}:${formattedSeconds}`;
};

// Format a time range for display
const formatTimeRange = (start: number | string, end: number | string): string => {
  return `${formatTime(start)} - ${formatTime(end)}`;
};

interface TranscriptionViewProps {
  currentTime?: number;
  isActive: boolean;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ currentTime = 0, isActive }) => {
  const { transcription, sections, status, videoInfo } = useVideo();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastScrollTimeRef = useRef<number>(0);
  const lastActiveIndexRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLIFrameElement | null>(null);

  // Find the active section based on current time
  const findActiveSectionIndex = useCallback((time: number) => {
    if (!sections || sections.length === 0) return -1;

    return sections.findIndex((section, index) => {
      // Convert timestamps to numbers for comparison if they're strings
      const sectionStart = typeof section.start === 'string'
        ? parseTimeToSeconds(section.start)
        : parseFloat(section.start as string);

      const nextSectionStart = index < sections.length - 1
        ? (typeof sections[index + 1].start === 'string'
          ? parseTimeToSeconds(sections[index + 1].start)
          : parseFloat(sections[index + 1].start as string))
        : Infinity;

      // Check if current time is within this section's range
      return time >= sectionStart && time < nextSectionStart;
    });
  }, [sections]);

  // Helper function to parse time strings to seconds
  const parseTimeToSeconds = (timeStr: string | number): number => {
    if (typeof timeStr === 'number') return timeStr;

    const cleanTime = timeStr.replace(/"/g, '');
    const parts = cleanTime.split(':').map(part => parseInt(part, 10));

    if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    } else {
      return parseInt(cleanTime, 10) || 0;
    }
  };

  // Update active section based on current time
  useEffect(() => {
    if (!sections || sections.length === 0 || !isActive) return;

    const newActiveIndex = findActiveSectionIndex(currentTime);

    if (newActiveIndex !== -1 && newActiveIndex !== activeSectionIndex) {
      setActiveSectionIndex(newActiveIndex);

      // Only scroll if the active section has changed significantly or after a delay
      const now = Date.now();
      if (
        (lastActiveIndexRef.current === null ||
          Math.abs(newActiveIndex - (lastActiveIndexRef.current || 0)) > 2) &&
        (now - lastScrollTimeRef.current > 1000)
      ) {
        // Scroll to the active section with a small delay to avoid too frequent scrolling
        if (isActive && sectionRefs.current[newActiveIndex]) {
          setTimeout(() => {
            sectionRefs.current[newActiveIndex]?.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            lastScrollTimeRef.current = Date.now();
          }, 100);
        }
      }

      lastActiveIndexRef.current = newActiveIndex;
    }
  }, [currentTime, sections, isActive, activeSectionIndex, findActiveSectionIndex]);

  // Reset refs when sections change
  useEffect(() => {
    if (sections && sections.length > 0) {
      sectionRefs.current = sectionRefs.current.slice(0, sections.length);
      lastActiveIndexRef.current = null;
      setActiveSectionIndex(null);
    }
  }, [sections]);

  // Function to play video from a specific time
  const playFromTime = useCallback((timeInSeconds: number) => {
    if (!videoInfo) return;

    try {
      // Try to find the YouTube player instance
      if (window.YT && window.YT.Player) {
        // Find the iframe element with the specific ID
        const iframeId = `youtube-iframe-${videoInfo.id}`;
        const iframe = document.getElementById(iframeId);
        if (iframe) {
          // Try to get the player instance
          const player = window.YT.get(iframeId);
          if (player && typeof player.seekTo === 'function') {
            // Use the player API directly
            player.seekTo(timeInSeconds, true);
            setTimeout(() => {
              player.playVideo();
            }, 100);
            return;
          }
        }
      }

      // Fallback to postMessage method
      const iframe = document.querySelector('iframe[src*="youtube.com"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        // First seek to the time
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [timeInSeconds, true]
          }),
          '*'
        );

        // Then play the video with a slight delay
        setTimeout(() => {
          iframe.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'playVideo',
              args: []
            }),
            '*'
          );
        }, 100);
      }
    } catch (error) {
      console.error("Error controlling YouTube player:", error);
    }
  }, [videoInfo]);

  // Handle section click
  const handleSectionClick = (index: number) => {
    // Toggle expanded state
    setExpandedSection(expandedSection === index ? null : index);

    // Play from section start time
    const section = sections[index];
    const startTime = typeof section.start === 'string'
      ? parseTimeToSeconds(section.start)
      : parseFloat(section.start as string);

    // Always play from section start time when clicked
    playFromTime(startTime);
  };

  // Show loading state when processing
  if (status === 'extracting' || status === 'transcribing' || status === 'sectioning') {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">
          {status === 'extracting' ? 'Processing video' :
            status === 'transcribing' ? 'Transcribing video' :
              'Creating sections'}
        </p>
      </div>
    );
  }

  // Show message when no video is loaded
  if (status !== 'ready' || !sections) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Add a video to see sections</p>
      </div>
    );
  }

  // Handle case when sections are empty
  if (!sections || sections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No sections available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 h-full overflow-auto" ref={scrollAreaRef}>
      <div className="space-y-4">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * Math.min(index, 10) }}
            className="group"
            ref={el => sectionRefs.current[index] = el}
          >
            <div
              className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${activeSectionIndex === index
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border/40 hover:border-border'
                }`}
              onClick={() => handleSectionClick(index)}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  {expandedSection === index ? (
                    <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                  )}
                  <h3 className="text-base font-medium">{section.title}</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeRange(section.start, section.end)}
                </span>
              </div>

              {/* Remove the summary when collapsed - only show when expanded */}
              {expandedSection === index && (
                <div className="mt-3 ml-6">
                  {Array.isArray(section.summary) ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {section.summary.map((point, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">{section.summary}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default TranscriptionView;
