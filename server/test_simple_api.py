#!/usr/bin/env python3
"""
Test script for the Simple Transcription API.
"""

import sys
import json
import requests
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8002"
TEST_AUDIO_URL = "https://static.deepgram.com/examples/interview_speech-analytics.wav"

def test_transcription_api():
    """Test the transcription API with a sample audio URL."""
    print(f"Testing transcription API at {API_BASE_URL}")
    print(f"Using test audio: {TEST_AUDIO_URL}")
    
    # First check if the server is running
    try:
        health_response = requests.get(f"{API_BASE_URL}/", timeout=5)
        print(f"Server status: {health_response.status_code}")
        print(f"Server response: {health_response.json()}")
    except Exception as e:
        print(f"Error connecting to server: {str(e)}")
        print("Make sure the server is running at the specified URL.")
        return False
    
    # Make the transcription request
    print("\nSending transcription request...")
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/transcribe",
            json={"audio_url": TEST_AUDIO_URL},
            timeout=60  # Increased timeout for transcription
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()
            text = data.get("text", "")
            
            print("\nTranscription successful!")
            print(f"\nTranscribed text: {text[:200]}..." if len(text) > 200 else f"\nTranscribed text: {text}")
            return True
        else:
            print(f"\nError: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"\nError: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_transcription_api()
    print("\nTest result:", "SUCCESS" if success else "FAILURE")
    sys.exit(0 if success else 1) 