import React, { useEffect, useRef, useState } from 'react';
import { useVideo } from '@/context/VideoContext';

interface YouTubePlayerProps {
    videoId: string;
    title: string;
    onTimeUpdate?: (currentTime: number) => void;
}

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, title, onTimeUpdate }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const ytPlayerRef = useRef<any>(null);
    const playerInitializedRef = useRef<boolean>(false);
    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const currentVideoIdRef = useRef<string>(videoId);

    // Load YouTube IFrame API once
    useEffect(() => {
        // Only load the API script once
        if (!document.getElementById('youtube-api-script')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-api-script';
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            // Define the callback function
            window.onYouTubeIframeAPIReady = () => {
                setIsApiLoaded(true);
            };
        } else if (window.YT && window.YT.Player) {
            // If the script is already loaded, check if YT is available
            setIsApiLoaded(true);
        }

        // Cleanup function
        return () => {
            stopTimeTracking();
        };
    }, []);

    // Initialize player when API is loaded
    useEffect(() => {
        if (!isApiLoaded || !containerRef.current) return;

        // Only initialize the player once
        if (!playerInitializedRef.current) {
            const playerId = `youtube-player-${videoId}`;

            // Create a div for the player if it doesn't exist
            if (!document.getElementById(playerId)) {
                const playerDiv = document.createElement('div');
                playerDiv.id = playerId;
                playerDiv.className = 'w-full h-full';
                containerRef.current.appendChild(playerDiv);
            }

            // Initialize the YouTube player
            ytPlayerRef.current = new window.YT.Player(playerId, {
                videoId: videoId,
                playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    rel: 0,
                    enablejsapi: 1,
                    origin: window.location.origin,
                    playsinline: 1,
                },
                events: {
                    onReady: (event: any) => {
                        playerInitializedRef.current = true;
                        currentVideoIdRef.current = videoId;

                        // Ensure the iframe has an ID that can be referenced
                        const iframe = event.target.getIframe();
                        if (iframe) {
                            iframe.id = `youtube-iframe-${videoId}`;
                        }
                    },
                    onStateChange: (event: any) => {
                        // Start tracking time when video is playing
                        if (event.data === window.YT.PlayerState.PLAYING) {
                            startTimeTracking();
                        } else {
                            stopTimeTracking();
                            // Send one last update when paused
                            if (onTimeUpdate && ytPlayerRef.current) {
                                onTimeUpdate(ytPlayerRef.current.getCurrentTime());
                            }
                        }
                    }
                }
            });
        }
        // If player is already initialized but videoId changed, just load the new video
        else if (currentVideoIdRef.current !== videoId && ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
            ytPlayerRef.current.loadVideoById(videoId);
            currentVideoIdRef.current = videoId;
        }
    }, [isApiLoaded, videoId, onTimeUpdate]);

    // Track current time
    const intervalRef = useRef<number | null>(null);

    const startTimeTracking = () => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
        }

        intervalRef.current = window.setInterval(() => {
            if (ytPlayerRef.current && onTimeUpdate && typeof ytPlayerRef.current.getCurrentTime === 'function') {
                try {
                    const currentTime = ytPlayerRef.current.getCurrentTime();
                    onTimeUpdate(currentTime);
                } catch (error) {
                    console.error('Error getting current time:', error);
                }
            }
        }, 200); // Update every 200ms
    };

    const stopTimeTracking = () => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Clean up interval on unmount
    useEffect(() => {
        return () => {
            stopTimeTracking();
            // Don't destroy the player on unmount to prevent reloading issues
        };
    }, []);

    return (
        <div className="aspect-video w-full">
            <div ref={containerRef} className="w-full h-full">
                {/* Player will be created here */}
            </div>
        </div>
    );
};

export default YouTubePlayer; 