import asyncio
from http.client import HTTPException
import json
import os
import logging
from pathlib import Path
import google.generativeai as genai
from typing import Optional, Dict, Any, List
import backoff
from services.utils.youtube_utils import extract_youtube_video_id
from services.models import VideoSections
logger = logging.getLogger(__name__)
root_dir = Path(__file__).parent

# Initialize Gemini API with the API key
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_KEY="AIzaSyA-SHhePPoVNmbUWMu8hhMm97lF1pDBaZg"
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables. Gemini API calls will fail.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

@backoff.on_exception(backoff.expo, Exception, max_tries=5, factor=2)
async def call_llm_with_instructor(
    messages: List[Dict[str, str]],
    model: str,
    model_provider: str,
    params: Optional[Dict[str, Any]] = None,
    response_model: Any = None
) -> Any:
    """
    Generate a structured response from an LLM using instructor.
    
    Args:
        messages: List of message dictionaries with role and content
        model: The model to use (e.g., "gemini-1.5-pro")
        model_provider: The provider of the model (e.g., "google")
        params: Optional parameters for the model (temperature, max_tokens, etc.)
        response_model: Pydantic model class for structured output
    
    Returns:
        The generated response as a structured object
    """
    import instructor
    
    if model_provider.lower() != "google":
        raise ValueError(f"Model provider '{model_provider}' is not supported yet. Currently only 'google' is supported.")
        
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set. Please set the environment variable.")
    
    try:
        logger.info(f"Generating response with {model_provider} model: {model}")
        
        # Extract parameters
        temperature = params.get("temperature", 0.7) if params else 0.7
        max_tokens = params.get("max_tokens", None)
        
        # Configure the model
        generation_config = {"temperature": temperature}
        if max_tokens:
            generation_config["max_output_tokens"] = max_tokens
            
        # Initialize the model with instructor
        client = instructor.from_gemini(
            client=genai.GenerativeModel(
                model_name=model,
                generation_config=generation_config
            ),
            use_async=True
        )
        
        # If a response model is provided, use structured output
        response = await client.chat.completions.create(
            messages=messages,
            response_model=response_model
        )
        return response
        
    except Exception as e:
        logger.error(f"Error generating response from {model_provider}: {str(e)}")
        raise e


def get_transcript_as_segments_from_words_for_llm(transcription_path: str):
    with open(transcription_path, 'r') as f:
        transcription_data = json.load(f)
    
    words = transcription_data['results']['channels'][0]['alternatives'][0]['words']

    segments = []

    current_segment = {
        'text': '',
        'start': None,
        'end': None
    }
    segment_duration = 10  # 10-second segments

    for i, word in enumerate(words):
        word_start = word['start']
        word_end = word['end']
        
        # Initialize the first segment
        if current_segment['start'] is None:
            current_segment['start'] = word_start
            current_segment['text'] = word['word']
            current_segment['end'] = word_end
            continue
        
        # Check if we're still within the same 10-second segment
        if word_start < current_segment['start'] + segment_duration:
            # Add space before appending the word
            if current_segment['text']:
                current_segment['text'] += ' '
            current_segment['text'] += word['word']
            current_segment['end'] = word_end
        else:
            # Save the completed segment
            segments.append(current_segment)
            
            # Start a new segment
            current_segment = {
                'text': word['word'],
                'start': word_start,
                'end': word_end
            }

    segments.append(current_segment)
    return '\n'.join([f'{segment["start"]} - {segment["end"]}: {segment["text"]}' for segment in segments])

async def divide_video_into_sections(youtube_url: str):
    video_id = extract_youtube_video_id(youtube_url)
    
    # Path to the transcription file
    transcription_path = f"{root_dir}/data/{video_id}/transcription.json"
    
    # Check if transcription exists
    if not os.path.exists(transcription_path):
        raise HTTPException(
            status_code=404, 
            detail="Transcription not found. Please transcribe the video first."
        )
    
    # Extract the transcript text
    transcript = get_transcript_as_segments_from_words_for_llm(transcription_path)
    
    if not transcript:
        raise HTTPException(
            status_code=500, 
            detail="Could not extract transcript from transcription file."
        )
    
    # System prompt for Gemini
    system_prompt = """You are an expert video content analyzer. Your task is to analyze a video transcript and divide it into sections that summarise the flow of the conversation. The conversation will be given in the format of a transcript. The sections that you return should have a start and end duration along with the heading of the section and a list of bulleted summary points of the section. Avoid the case where consecutive segments are talking about the same thing. There is no restriction or limitation on how big each segment should be. Keep it as long or as short it needs to be.
    
    Return your response as a valid JSON object with the following structure:
    {
        "sections": [
            {
                "title": str,
                "start": str,
                "end": str,
                "summary": List[str]
            }
        ]
    }
    
    Make sure your JSON is properly formatted and valid."""
    
    # User message containing the transcript
    user_message = f"Here is the transcript of a video. Please analyze it and create sections:\n\n{transcript}"
    
    # Call Gemini to generate sections
    logger.info("Calling Gemini to generate sections...")

    response = await call_llm_with_instructor(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        model="gemini-2.0-flash",
        model_provider="google",
        params={"temperature": 0.2},
        response_model=VideoSections
    )

    sections = response.model_dump()['sections']
    
    # Save the sections to a file
    sections_path = f"{root_dir}/data/{video_id}/sections.json"
    with open(sections_path, 'w') as f:
        json.dump(sections, f, indent=4)
    
    return sections

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", type=str, default='https://youtu.be/VGDlKrCKh6E')
    args = parser.parse_args()
    response = asyncio.run(divide_video_into_sections(args.url))
    print(response)


