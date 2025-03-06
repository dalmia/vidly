#!/usr/bin/env python3
"""
Simple FastAPI server that transcribes audio from a URL using Deepgram.
"""

import os
import logging
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, HttpUrl
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from server/.env file
server_dir = Path(__file__).parent
env_path = server_dir / '.env'
load_dotenv(dotenv_path=env_path)

# Check if DEEPGRAM_API_KEY is loaded
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
if not DEEPGRAM_API_KEY:
    raise ValueError("DEEPGRAM_API_KEY not found in environment variables. Please check your .env file.")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Simple Transcription API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Models
class TranscriptionRequest(BaseModel):
    audio_url: HttpUrl

class TranscriptionResponse(BaseModel):
    text: str

class YouTubeRequest(BaseModel):
    youtube_url: str

class YouTubeResponse(BaseModel):
    success: bool
    message: str
    file_path: Optional[str] = None

@app.get("/")
async def root():
    return {"status": "running"}

@app.post("/audios/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(request: TranscriptionRequest):
    """
    Transcribe audio from a URL using Deepgram.
    """
    try:
        from deepgram import DeepgramClient, PrerecordedOptions, UrlSource
        
        logger.info(f"Transcribing audio from URL: {request.audio_url}")
        
        # Initialize Deepgram client
        deepgram = DeepgramClient(DEEPGRAM_API_KEY)
        
        # Configure transcription options
        options = PrerecordedOptions(
            model="nova-2",
            language="en",
            smart_format=True,
            punctuate=True,
        )
        
        # Create URL source
        source = UrlSource(url=str(request.audio_url))
        
        # Send the audio to Deepgram for transcription
        logger.info("Sending request to Deepgram API")
        
        # The transcribe_url method returns a response directly, not a coroutine
        # So we don't need to await it
        response = deepgram.listen.prerecorded.v("1").transcribe_url(source, options)
        
        # Extract the transcription text
        if not response or not response.results:
            logger.error("No transcription results returned from Deepgram")
            raise HTTPException(status_code=500, detail="No transcription results returned")
        
        # Get the full transcript
        transcript = response.results.channels[0].alternatives[0].transcript
        
        logger.info(f"Transcription completed: {transcript[:50]}...")
        return {"text": transcript}
        
    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")

@app.post("/videos/extract_audio", response_model=YouTubeResponse)
async def extract_audio_from_youtube_video(request: YouTubeRequest):
    """
    Download audio from a YouTube video.
    """
    try:
        from services.youtube_service import download_youtube_audio
        
        logger.info(f"Downloading audio from YouTube URL: {request.youtube_url}")
        
        # Download the audio
        audio_path = await download_youtube_audio(request.youtube_url)
        
        logger.info(f"Audio downloaded successfully to: {audio_path}")
        return {
            "success": True,
            "message": "Audio downloaded successfully",
            "file_path": audio_path
        }
        
    except Exception as e:
        logger.error(f"Error downloading YouTube audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading YouTube audio: {str(e)}")


@app.post("/videos/transcribe", response_model=YouTubeResponse)
async def transcribe_youtube(request: YouTubeRequest):
    """
    Transcribe a YouTube video.
    Assumes that the audio for the video has already been extracted using /videos/extract_audio.
    """
    try:
        from services.youtube_service import download_youtube_audio
        from services.transcription_service import transcribe
        
        logger.info(f"Processing YouTube URL for transcription: {request.youtube_url}")
                
        logger.info("Transcribing the audio...")
        transcription_result = transcribe(request.youtube_url)
        logger.info("Transcription completed successfully")
        
        return {
            "success": True,
            "message": "YouTube video transcribed successfully",
            "file_path": transcription_result
        }
        
    except Exception as e:
        logger.error(f"Error transcribing YouTube video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error transcribing YouTube video: {str(e)}")

@app.post("/videos/create_sections", response_model=dict)
async def create_sections(request: YouTubeRequest):
    """
    Create sections for a YouTube video based on its transcription.
    Assumes that the transcription for the video already exists.
    """
    try:
        from services.llm_service import divide_video_into_sections
        
        logger.info(f"Creating sections for YouTube URL: {request.youtube_url}")
        
        sections = await divide_video_into_sections(request.youtube_url)
        return sections.model_dump()  # Return the Pydantic model as a dict
    
    except Exception as e:
        logger.error(f"Error creating sections: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating sections: {str(e)}")



if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True) 