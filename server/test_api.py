#!/usr/bin/env python3
"""
Test script for the Vidly Transcription API.
This script tests the transcription API by transcribing a short YouTube video.
"""

import os
import sys
import time
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_BASE_URL = "http://localhost:8002"
TEST_VIDEO_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw"  # "Me at the zoo" - First YouTube video (19 seconds)

def test_transcription_api():
    """Test the transcription API by transcribing a short YouTube video."""
    print(f"Testing transcription API at {API_BASE_URL}")
    print(f"Using test video: {TEST_VIDEO_URL}")
    
    # Step 1: Start transcription
    print("\n1. Starting transcription...")
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/transcribe",
            json={"youtube_url": TEST_VIDEO_URL},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        task_id = data.get("task_id")
        status = data.get("status")
        
        print(f"   Response: task_id={task_id}, status={status}")
        
        if not task_id:
            print("   Error: No task_id returned")
            return False
    except Exception as e:
        print(f"   Error starting transcription: {str(e)}")
        return False
    
    # Step 2: Poll for completion
    print("\n2. Polling for completion...")
    max_attempts = 30  # 5 minutes (10s * 30)
    attempts = 0
    
    while attempts < max_attempts:
        try:
            print(f"   Attempt {attempts + 1}/{max_attempts}...")
            response = requests.get(
                f"{API_BASE_URL}/api/transcription/{task_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                # Transcription is complete
                data = response.json()
                print("\n3. Transcription completed successfully!")
                print(f"   Segments: {len(data.get('segments', []))}")
                print(f"   Full text: {data.get('fullText', '')[:100]}...")
                return True
            elif response.status_code == 404:
                # Still processing
                print("   Still processing...")
                attempts += 1
                time.sleep(10)  # Wait 10 seconds between polls
            else:
                # Error
                print(f"   Error: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"   Error polling for completion: {str(e)}")
            attempts += 1
            time.sleep(10)  # Wait 10 seconds between polls
    
    print("\n   Error: Transcription timed out")
    return False

if __name__ == "__main__":
    success = test_transcription_api()
    print("\nTest result:", "SUCCESS" if success else "FAILURE")
    sys.exit(0 if success else 1) 