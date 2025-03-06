import { VideoInfo, Transcription, VideoSection } from './types';

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

// This function fetches the actual YouTube video information using the YouTube Data API
export const fetchYouTubeVideoInfo = async (videoId: string): Promise<{title: string, thumbnail: string, duration: string}> => {
  try {
    // Using the YouTube oEmbed API which doesn't require an API key
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch video information');
    }
    
    const data = await response.json();
    
    return {
      title: data.title,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, // Using the standard YouTube thumbnail URL
      duration: '10:30' // YouTube oEmbed doesn't provide duration, so we'll keep the placeholder
    };
  } catch (error) {
    console.error('Error fetching YouTube video info:', error);
    // Fallback to default values if the API call fails
    return {
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: '10:30'
    };
  }
};

// Fetch video info using the YouTube API
export const fetchVideoInfo = async (url: string): Promise<VideoInfo> => {
  console.log('Fetching video info for:', url);
  
  // Extract video ID from YouTube URL
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    // Fetch actual video information from YouTube
    const videoInfo = await fetchYouTubeVideoInfo(videoId);
    
    // Return actual video data
    return {
      id: videoId,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      duration: videoInfo.duration
    };
  } catch (error) {
    console.error('Error fetching video info:', error);
    // Fallback to default values if the API call fails
    return {
      id: videoId,
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: '10:30'
    };
  }
};

// Use the backend API to transcribe the video
export const transcribeVideo = async (videoId: string): Promise<Transcription> => {
  console.log('Transcribing video:', videoId);
  
  try {
    // Start transcription
    const startResponse = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      ...defaultFetchOptions,
      body: JSON.stringify({ youtube_url: `https://www.youtube.com/watch?v=${videoId}` }),
    });
    
    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error('Transcription start error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || 'Failed to start transcription');
      } catch (e) {
        throw new Error(`Failed to start transcription: ${startResponse.status} ${startResponse.statusText}`);
      }
    }
    
    const startData = await startResponse.json();
    const taskId = startData.task_id;
    
    // Poll for completion
    let complete = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (5s * 60)
    
    while (!complete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls
      
      try {
        const pollResponse = await fetch(`${API_BASE_URL}/api/transcription/${taskId}`, {
          method: 'GET',
          ...defaultFetchOptions,
        });
        
        if (pollResponse.ok) {
          // Transcription is complete
          return await pollResponse.json();
        } else if (pollResponse.status === 404) {
          // Still processing
          attempts++;
        } else {
          // Error
          const errorText = await pollResponse.text();
          console.error('Polling error response:', errorText);
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.detail || 'Error fetching transcription');
          } catch (e) {
            throw new Error(`Error fetching transcription: ${pollResponse.status} ${pollResponse.statusText}`);
          }
        }
      } catch (err) {
        console.error('Error polling for transcription:', err);
        // Continue polling despite errors
        attempts++;
      }
    }
    
    throw new Error('Transcription timed out. Please try again later.');
  } catch (error) {
    console.error('Error transcribing video:', error);
    throw error;
  }
};

// Use the backend API to chat with the video
export const chatWithVideo = async (
  videoId: string, 
  transcription: string, 
  message: string
): Promise<string> => {
  console.log('Chatting with video:', videoId, 'Message:', message);
  
  try {
    // This would be implemented in a real backend
    // For now, return a simple response
    return "This feature is not yet implemented in the backend API.";
  } catch (error) {
    console.error('Error chatting with video:', error);
    throw error;
  }
};

// Helper function to extract YouTube video ID from various URL formats
export const extractYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

// Extract audio from a YouTube video
export const extractAudio = async (videoId: string): Promise<void> => {
  console.log('Extracting audio for video:', videoId);
  
  try {
    const response = await fetch(`${API_BASE_URL}/videos/extract_audio`, {
      method: 'POST',
      ...defaultFetchOptions,
      body: JSON.stringify({ youtube_url: `https://www.youtube.com/watch?v=${videoId}` }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Audio extraction error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || 'Failed to extract audio');
      } catch (e) {
        throw new Error(`Failed to extract audio: ${response.status} ${response.statusText}`);
      }
    }
    
    // Ensure we fully consume the response
    await response.text();
    console.log('Audio extraction completed successfully');
  } catch (error) {
    console.error('Error extracting audio:', error);
    throw error;
  }
};

// Start transcription of a video
export const startTranscription = async (videoId: string): Promise<void> => {
  console.log('Starting transcription for video:', videoId);
  
  try {
    const response = await fetch(`${API_BASE_URL}/videos/transcribe`, {
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
    
    // Ensure we fully consume the response
    await response.text();
    console.log('Transcription completed successfully');
  } catch (error) {
    console.error('Error starting transcription:', error);
    throw error;
  }
};

// Create sections from a transcribed video
export const createSections = async (videoId: string): Promise<VideoSection[]> => {
  console.log('Creating sections for video:', videoId);
  
  try {
    const response = await fetch(`${API_BASE_URL}/videos/create_sections`, {
      method: 'POST',
      ...defaultFetchOptions,
      body: JSON.stringify({ youtube_url: `https://www.youtube.com/watch?v=${videoId}` }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Section creation error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || 'Failed to create sections');
      } catch (e) {
        throw new Error(`Failed to create sections: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log('Sections created successfully:', data);
    
    // Return the sections data which includes transcription segments
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error creating sections:', error);
    throw error;
  }
};

// Answer a question about a video at a specific timestamp
export const answerQuestion = async (
  videoId: string,
  question: string,
  timestamp: string
): Promise<string> => {
  console.log('Answering question for video:', videoId, 'Question:', question, 'Timestamp:', timestamp);
  
  try {
    const response = await fetch(`${API_BASE_URL}/videos/answer_question`, {
      method: 'POST',
      ...defaultFetchOptions,
      body: JSON.stringify({
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        question: question,
        timestamp: timestamp
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Answer question error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || 'Failed to answer question');
      } catch (e) {
        throw new Error(`Failed to answer question: ${response.status} ${response.statusText}`);
      }
    }
    
    // The response is a string
    return await response.text();
  } catch (error) {
    console.error('Error answering question:', error);
    throw error;
  }
};