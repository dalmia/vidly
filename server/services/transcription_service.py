import os
import asyncio
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

# async def transcribe_audio_file(audio_path: str) -> List[Dict[str, Any]]:
#     """
#     Transcribe an audio file using Deepgram and return the transcription segments.
    
#     Args:
#         audio_path: Path to the audio file
        
#     Returns:
#         List of transcription segments with text, start, and end times
#     """
#     if not deepgram:
#         raise ValueError("Deepgram client not initialized. Please set DEEPGRAM_API_KEY.")
    
#     logger.info(f"Transcribing audio file: {audio_path}")
    
#     try:
#         # Configure transcription options
#         options = PrerecordedOptions(
#             smart_format=True,
#             model="nova-2",
#             language="en",
#             punctuate=True,
#             utterances=True,
#             diarize=True
#         )
        
#         # Open the audio file
#         with open(audio_path, "rb") as audio:
#             source = FileSource(buffer=audio.read())
            
#             # Send the audio to Deepgram for transcription
#             response = await deepgram.listen.prerecorded.v("1").transcribe_file(source, options)
            
#             # Process the response
#             if not response or not response.results:
#                 logger.error("No transcription results returned from Deepgram")
#                 return []
            
#             # Extract the transcription segments
#             segments = []
            
#             # Check if we have utterances
#             if hasattr(response.results, 'utterances') and response.results.utterances:
#                 # Process utterances (preferred as they're more natural segments)
#                 for utterance in response.results.utterances:
#                     segments.append({
#                         "text": utterance.transcript,
#                         "start": utterance.start,
#                         "end": utterance.end
#                     })
#             else:
#                 # Fall back to paragraphs or words if utterances aren't available
#                 for paragraph in response.results.channels[0].alternatives[0].paragraphs.paragraphs:
#                     segments.append({
#                         "text": paragraph.text,
#                         "start": paragraph.start,
#                         "end": paragraph.end
#                     })
            
#             logger.info(f"Transcription completed with {len(segments)} segments")
#             return segments
#     except Exception as e:
#         logger.error(f"Error transcribing audio: {str(e)}")
#         raise

async def transcribe_audio_stream(audio_stream, callback):
    """
    Transcribe an audio stream in real-time using Deepgram.
    
    Args:
        audio_stream: Audio stream to transcribe
        callback: Function to call with each transcription segment
    """
    if not deepgram:
        raise ValueError("Deepgram client not initialized. Please set DEEPGRAM_API_KEY.")
    
    logger.info("Starting real-time transcription")
    
    try:
        # Configure live transcription options
        options = LiveOptions(
            smart_format=True,
            model="nova-2",
            language="en",
            punctuate=True,
            interim_results=True,
            utterance_end_ms=1000,
            encoding="linear16",
            channels=1,
            sample_rate=16000
        )
        
        # Create a connection to Deepgram for live transcription
        connection = deepgram.listen.live.v("1").create_connection(options)
        
        # Set up event handlers
        @connection.on(LiveTranscriptionEvents.TRANSCRIPT_RECEIVED)
        def handle_transcript(transcript):
            # Process the transcript
            if transcript.channel and transcript.channel.alternatives:
                alternative = transcript.channel.alternatives[0]
                if alternative.transcript:
                    segment = {
                        "text": alternative.transcript,
                        "start": transcript.start,
                        "end": transcript.start + transcript.duration
                    }
                    asyncio.create_task(callback(segment))
        
        # Stream audio data to Deepgram
        async for chunk in audio_stream:
            connection.send(chunk)
            
        # Close the connection when done
        await connection.finish()
        
        logger.info("Real-time transcription completed")
    except Exception as e:
        logger.error(f"Error in real-time transcription: {str(e)}")
        raise 

def transcribe(youtube_url: str):
    video_id = extract_youtube_video_id(youtube_url)

    # Path to the audio file
    AUDIO_FILE = f"{root_dir}/data/{video_id}/audio.webm"

    try:
        # Check file size before processing
        import os
        file_size = os.path.getsize(AUDIO_FILE)
        print(f"Processing file of size: {file_size / (1024 * 1024):.2f} MB")
        
        with open(AUDIO_FILE, "rb") as file:
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

        with open(f'{root_dir}/data/{video_id}/transcription.json', 'w') as f:
            f.write(response.to_json(indent=4))

        return response

    except Exception as e:
        print(f"Exception: {e}")
        # Add more detailed error logging
        import traceback
        print(traceback.format_exc())
        raise



if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", type=str, default='https://youtu.be/VGDlKrCKh6E')
    args = parser.parse_args()
    transcribe(args.url)