import React, { useState, useEffect, useRef } from 'react';
import { Transcription, TranscriptionSegment, VideoStatus } from '../lib/types';

// Backend API base URL
const API_BASE_URL = 'http://localhost:8002';

// Default fetch options to handle CORS
const defaultFetchOptions = {
    mode: 'cors' as RequestMode,
    credentials: 'include' as RequestCredentials,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
};

interface TranscriptionStreamProps {
    videoId: string | null;
    onTranscriptionComplete?: (transcription: Transcription) => void;
    onStatusChange?: (status: VideoStatus) => void;
}

const TranscriptionStream: React.FC<TranscriptionStreamProps> = ({
    videoId,
    onTranscriptionComplete,
    onStatusChange,
}) => {
    const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
    const [status, setStatus] = useState<VideoStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    // Start transcription when videoId changes
    useEffect(() => {
        if (!videoId) {
            setStatus('idle');
            return;
        }

        const startTranscription = async () => {
            try {
                setStatus('transcribing');
                onStatusChange?.('transcribing');

                // Call the API to start transcription
                const response = await fetch(`${API_BASE_URL}/transcribe`, {
                    method: 'POST',
                    ...defaultFetchOptions,
                    body: JSON.stringify({ youtube_url: `https://www.youtube.com/watch?v=${videoId}` }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Transcription start error response:', errorText);
                    try {
                        const errorData = JSON.parse(errorText);
                        throw new Error(errorData.detail || 'Failed to start transcription');
                    } catch (e) {
                        throw new Error(`Failed to start transcription: ${response.status} ${response.statusText}`);
                    }
                }

                const data = await response.json();
                console.log('Transcription started:', data);

                // Connect to the streaming endpoint
                connectToStream(data.task_id);
            } catch (err) {
                console.error('Error starting transcription:', err);
                setError(err.message || 'Failed to start transcription');
                setStatus('error');
                onStatusChange?.('error');
            }
        };

        startTranscription();

        // Cleanup function
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [videoId]);

    const connectToStream = (taskId: string) => {
        // Close any existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        // Create a new EventSource connection
        const eventSourceUrl = `${API_BASE_URL}/transcription/${taskId}/stream`;
        console.log('Connecting to stream:', eventSourceUrl);

        const eventSource = new EventSource(eventSourceUrl);
        eventSourceRef.current = eventSource;

        // Handle connection open
        eventSource.onopen = () => {
            console.log('Stream connection opened');
        };

        // Handle incoming segments
        eventSource.addEventListener('segment', (event) => {
            try {
                console.log('Received segment:', event.data);
                const segment = JSON.parse(event.data);
                setSegments((prevSegments) => [...prevSegments, segment]);
            } catch (err) {
                console.error('Error parsing segment:', err);
            }
        });

        // Handle completion
        eventSource.addEventListener('complete', () => {
            console.log('Stream complete');
            eventSource.close();
            eventSourceRef.current = null;

            // Create the full transcription object
            const fullText = segments.map(segment => segment.text).join(' ');
            const transcription: Transcription = {
                segments,
                fullText,
            };

            setStatus('ready');
            onStatusChange?.('ready');
            onTranscriptionComplete?.(transcription);
        });

        // Handle errors
        eventSource.onerror = (event) => {
            console.error('Stream error:', event);

            // Check if the connection was closed
            if (eventSource.readyState === EventSource.CLOSED) {
                eventSource.close();
                eventSourceRef.current = null;

                if (segments.length > 0) {
                    // If we have segments, consider it complete
                    const fullText = segments.map(segment => segment.text).join(' ');
                    const transcription: Transcription = {
                        segments,
                        fullText,
                    };

                    setStatus('ready');
                    onStatusChange?.('ready');
                    onTranscriptionComplete?.(transcription);
                } else {
                    setError('Error during transcription streaming');
                    setStatus('error');
                    onStatusChange?.('error');
                }
            }
        };
    };

    return (
        <div className="transcription-stream">
            {status === 'transcribing' && (
                <div className="transcribing-indicator">
                    <p>Transcribing video... {segments.length > 0 ? `(${segments.length} segments received)` : ''}</p>
                    <div className="progress-bar">
                        <div className="progress-bar-inner" style={{ width: `${Math.min(segments.length * 5, 100)}%` }}></div>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="error-message">
                    <p>Error: {error}</p>
                </div>
            )}

            {segments.length > 0 && (
                <div className="transcription-segments">
                    <h3>Transcription Segments</h3>
                    <div className="segments-container">
                        {segments.map((segment, index) => (
                            <div key={index} className="segment">
                                <span className="segment-time">{formatTime(segment.start)} - {formatTime(segment.end)}</span>
                                <p className="segment-text">{segment.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default TranscriptionStream; 