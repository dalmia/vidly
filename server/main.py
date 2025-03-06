#!/usr/bin/env python3
"""
Simple FastAPI server that transcribes audio from a URL using Deepgram.
"""

import os
import traceback
import logging
from pathlib import Path
from typing import Optional, List
from pydantic import BaseModel, HttpUrl
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from services.models import Section
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

class SuccessResponse(BaseModel):
    success: bool


class AnswerQuestionRequest(BaseModel):
    youtube_url: str
    question: str
    timestamp: str


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


@app.post("/videos/extract_audio", response_model=SuccessResponse)
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
        }
        
    except Exception as e:
        logger.error(f"Error downloading YouTube audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading YouTube audio: {str(e)}")


@app.post("/videos/transcribe", response_model=SuccessResponse)
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
        await transcribe(request.youtube_url)
        logger.info("Transcription completed successfully")
        
        return {
            "success": True,
        }
        
    except Exception as e:
        logger.error(f"Error transcribing YouTube video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error transcribing YouTube video: {str(e)}")


@app.post("/videos/create_sections", response_model=List[Section])
async def create_sections(request: YouTubeRequest):
    """
    Create sections for a YouTube video based on its transcription.
    Assumes that the transcription for the video already exists.
    """
    try:
        from services.llm_service import divide_video_into_sections
        
        logger.info(f"Creating sections for YouTube URL: {request.youtube_url}")
        
        sections = await divide_video_into_sections(request.youtube_url)
        return sections
    
    except Exception as e:
        logger.error(f"Error creating sections: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating sections: {str(e)}")


@app.post("/videos/answer_question", response_model=str)
async def answer_question_endpoint(request: AnswerQuestionRequest):
    """
    Answer a question about a YouTube video based on its transcription and sections.
    Assumes that the transcription and sections for the video already exist.
    
    Request should contain:
    - youtube_url: The URL of the YouTube video
    - question: The question to answer
    - timestamp: The timestamp in the video (format: HH:MM:SS)
    """
    try:
        from services.llm_service import answer_question
        
        youtube_url = request.youtube_url
        question = request.question
        timestamp = request.timestamp
        
        if not youtube_url or not question or not timestamp:
            raise HTTPException(
                status_code=400, 
                detail="Missing required fields: youtube_url, question, or timestamp"
            )
        
        logger.info(f"Answering question for YouTube URL: {youtube_url}")
        logger.info(f"Question: {question}")
        logger.info(f"Timestamp: {timestamp}")
        
        response = await answer_question(youtube_url, question, timestamp)
        return response
    
    except Exception as e:
        traceback.print_exc()
        logger.error(f"Error answering question: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")



if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True) 