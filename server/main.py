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

@app.get("/")
async def root():
    return {"message": "Simple Transcription API", "status": "running"}

@app.post("/api/transcribe", response_model=TranscriptionResponse)
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True) 