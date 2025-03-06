import os
import asyncio
import logging
import subprocess
from pathlib import Path
from typing import Optional
from services.utils.youtube_utils import extract_youtube_video_id
logger = logging.getLogger(__name__)

# directory path for where the file is
root_dir = Path(__file__).parent
TEMP_DIR = root_dir / "data"
TEMP_DIR.mkdir(exist_ok=True)


def _download_audio(youtube_url: str) -> str:
    """
    Internal function to download audio from YouTube using yt-dlp.
    This runs in a separate thread.
    """
    try:
        video_id = extract_youtube_video_id(youtube_url)
        
        if not video_id:
            raise ValueError("Could not extract video ID from URL")
        
        # Define output path and filename template
        output_path = TEMP_DIR / video_id
        output_template = str(output_path / f"audio.%(ext)s")
        
        # Prepare the yt-dlp command to download only audio in webm format
        cmd = [
            "yt-dlp",
            "-f", "bestaudio[ext=webm]/bestaudio",  # Get best audio in webm format if available
            "--progress",  # Show progress bar
            "-o", output_template,  # Output filename template
            youtube_url  # URL to download
        ]
        
        # Run the command
        result = subprocess.run(cmd, text=True, check=True)
        
        # Find the downloaded file (extension might be webm or another format)
        downloaded_files = list(output_path.glob(f"audio.*"))
        if not downloaded_files:
            logger.error(f"Download seemed to succeed but no file found for video ID: {video_id}")
            raise FileNotFoundError(f"Downloaded file not found for video ID: {video_id}")
        
        # Use the first matching file (should be only one)
        full_path = downloaded_files[0]
        logger.info(f"Downloaded audio file: {full_path}")
        
        return str(full_path)
    except subprocess.CalledProcessError as e:
        logger.error(f"yt-dlp error: {str(e)}")
        raise ValueError(f"Failed to download YouTube audio: {str(e)}")
    except Exception as e:
        logger.error(f"Error downloading YouTube audio: {str(e)}")
        raise


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


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", type=str, default='https://youtu.be/5C_HPTJg5ek')
    args = parser.parse_args()
    asyncio.run(download_youtube_audio(args.url))