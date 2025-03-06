import React, { useState } from 'react';
import TranscriptionStream from '../components/TranscriptionStream';
import { Transcription, VideoStatus } from '../lib/types';
import { extractYoutubeVideoId, transcribeVideo } from '../lib/api';
import '../styles/transcription.css';

// Backend API base URL
const API_BASE_URL = 'http://localhost:8002';

const TranscriptionDemo: React.FC = () => {
    const [youtubeUrl, setYoutubeUrl] = useState<string>('');
    const [videoId, setVideoId] = useState<string | null>(null);
    const [status, setStatus] = useState<VideoStatus>('idle');
    const [transcription, setTranscription] = useState<Transcription | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [useStreaming, setUseStreaming] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Reset state
        setTranscription(null);
        setError(null);

        // Extract video ID from URL
        const extractedId = extractYoutubeVideoId(youtubeUrl);

        if (!extractedId) {
            setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
            return;
        }

        if (useStreaming) {
            // Use streaming approach
            setVideoId(extractedId);
        } else {
            // Use direct fetch approach
            fetchCompleteTranscription(extractedId);
        }
    };

    const fetchCompleteTranscription = async (videoId: string) => {
        try {
            setIsLoading(true);
            setStatus('transcribing');

            console.log('Starting transcription for video ID:', videoId);

            // Use the transcribeVideo function from our API
            const result = await transcribeVideo(videoId);
            console.log('Transcription result:', result);

            setTranscription(result);
            setStatus('ready');
            setVideoId(videoId);
        } catch (err) {
            console.error('Error fetching transcription:', err);
            setError(err.message || 'Failed to fetch transcription');
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = (newStatus: VideoStatus) => {
        setStatus(newStatus);

        if (newStatus === 'error') {
            setVideoId(null);
        }
    };

    const handleTranscriptionComplete = (completedTranscription: Transcription) => {
        setTranscription(completedTranscription);
    };

    return (
        <div className="transcription-demo">
            <h1>YouTube Video Transcription</h1>
            <p>Enter a YouTube URL to transcribe the video and get the results.</p>

            <form onSubmit={handleSubmit} className="url-form">
                <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                    className="url-input"
                    disabled={status === 'transcribing' || isLoading}
                />
                <div className="transcription-options">
                    <label className="option-label">
                        <input
                            type="checkbox"
                            checked={useStreaming}
                            onChange={() => setUseStreaming(!useStreaming)}
                            disabled={status === 'transcribing' || isLoading}
                        />
                        Stream transcription in real-time
                    </label>
                </div>
                <button
                    type="submit"
                    className="submit-button"
                    disabled={status === 'transcribing' || isLoading || !youtubeUrl}
                >
                    {isLoading ? 'Transcribing' : 'Transcribe Video'}
                </button>
            </form>

            {error && (
                <div className="error-message">
                    <p>Error: {error}</p>
                    <p className="error-help">
                        Make sure the backend server is running on port 8002 and that you have set up your Deepgram API key.
                    </p>
                </div>
            )}

            {videoId && (
                <div className="video-preview">
                    <h2>Video Preview</h2>
                    <div className="video-container">
                        <iframe
                            width="560"
                            height="315"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}

            {videoId && useStreaming && (
                <TranscriptionStream
                    videoId={videoId}
                    onStatusChange={handleStatusChange}
                    onTranscriptionComplete={handleTranscriptionComplete}
                />
            )}

            {isLoading && !useStreaming && (
                <div className="transcribing-indicator">
                    <p>Transcribing video... This may take a few minutes.</p>
                    <div className="progress-bar">
                        <div className="progress-bar-inner progress-bar-pulse"></div>
                    </div>
                </div>
            )}

            {transcription && (
                <div className="full-transcription">
                    <h2>Full Transcription</h2>
                    <div className="transcription-text">
                        <p>{transcription.fullText}</p>
                    </div>
                    <div className="transcription-segments">
                        <h3>Transcription Segments</h3>
                        <div className="segments-container">
                            {transcription.segments.map((segment, index) => (
                                <div key={index} className="segment">
                                    <span className="segment-time">
                                        {formatTime(segment.start)} - {formatTime(segment.end)}
                                    </span>
                                    <p className="segment-text">{segment.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const blob = new Blob([transcription.fullText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `transcription-${videoId}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="download-button"
                    >
                        Download Transcription
                    </button>
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

export default TranscriptionDemo; 