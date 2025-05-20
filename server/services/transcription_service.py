import json
import os
from os.path import join
import asyncio
from glob import glob
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
    FileSource,
    LiveOptions,
    LiveTranscriptionEvents,
)
from services.utils.youtube_utils import extract_youtube_video_id
# from settings import settings

logger = logging.getLogger(__name__)
root_dir = Path(__file__).parent

# Initialize Deepgram client
# DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
DEEPGRAM_API_KEY="90bf381ffb49fbacc28467047746434139aec2ec"

if not DEEPGRAM_API_KEY:
    logger.error("DEEPGRAM_API_KEY not found in environment variables. Please check your server/.env file.")
    logger.error("Make sure you have a line like: DEEPGRAM_API_KEY=your_deepgram_api_key_here")

deepgram = DeepgramClient(DEEPGRAM_API_KEY) if DEEPGRAM_API_KEY else None

async def transcribe(youtube_url: str):
    video_id = extract_youtube_video_id(youtube_url)

    transcription_path = f"{root_dir}/data/{video_id}/transcription.json"
    if os.path.exists(transcription_path):
        return

    # Path to the audio file
    audio_file_dir = f"{root_dir}/data/{video_id}"
    
    files = glob(join(audio_file_dir, 'audio.*'))

    if not files:
        raise ValueError('No file found')
    
    audio_file_path = files[0]

    try:
        # Check file size before processing
        file_size = os.path.getsize(audio_file_path)
        print(f"Processing file of size: {file_size / (1024 * 1024):.2f} MB")
        
        with open(audio_file_path, "rb") as file:
            buffer_data = file.read()
        
        deepgram = DeepgramClient(DEEPGRAM_API_KEY)

        options = PrerecordedOptions(
            model="nova-3",
            language="en",
            # Add timeout parameter (in seconds)
            
        )

        payload: FileSource = {
            "buffer": buffer_data,
        }
        
        # Add logging to track request progress
        print("Sending transcription request to Deepgram...")
        
        # STEP 3: Call the transcribe_file method with the text payload and options
        response = deepgram.listen.rest.v("1").transcribe_file(payload, options, timeout=300)

        # STEP 4: Print the response
        print(response.to_json(indent=4))

        with open(transcription_path, 'w') as f:
            f.write(response.to_json(indent=4))

    except Exception as e:
        logger.info(f"Exception: {e}")
        raise e


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", type=str, default='https://youtu.be/5C_HPTJg5ek')
    args = parser.parse_args()
    transcribe(args.url)