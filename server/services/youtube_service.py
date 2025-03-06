import os
import asyncio
import logging
from pathlib import Path
from pytube import YouTube
from typing import Optional

logger = logging.getLogger(__name__)

# Create a directory for temporary audio files
TEMP_DIR = Path("./temp_audio")
TEMP_DIR.mkdir(exist_ok=True)

async def download_youtube_audio(youtube_url: str) -> str:
    """
    Download the audio from a YouTube video and return the path to the audio file.
    
    Args:
        youtube_url: The URL of the YouTube video
        
    Returns:
        The path to the downloaded audio file
    """
    logger.info(f"Downloading audio from YouTube URL: {youtube_url}")
    
    # Run the download in a thread pool to avoid blocking the event loop
    loop = asyncio.get_running_loop()
    audio_path = await loop.run_in_executor(None, _download_audio, youtube_url)
    
    logger.info(f"Audio downloaded to: {audio_path}")
    return audio_path

def _download_audio(youtube_url: str) -> str:
    """
    Internal function to download audio from YouTube.
    This runs in a separate thread.
    """
    try:
        # Create a YouTube object
        yt = YouTube(youtube_url)
        
        # Get the video ID to use as the filename
        video_id = yt.video_id
        
        # Get the audio stream with the highest quality
        audio_stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
        
        if not audio_stream:
            raise ValueError("No audio stream found for this video")
        
        # Download the audio file
        output_path = TEMP_DIR
        filename = f"{video_id}.mp4"  # pytube downloads as mp4 even for audio only
        
        # Check if file already exists and remove it
        full_path = output_path / filename
        if full_path.exists():
            os.remove(full_path)
        
        # Download the file
        audio_stream.download(output_path=output_path, filename=filename)
        
        return str(full_path)
    except Exception as e:
        logger.error(f"Error downloading YouTube audio: {str(e)}")
        raise 