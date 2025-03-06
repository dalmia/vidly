#!/usr/bin/env python3
"""
Check if the Deepgram API key is set up correctly.
"""

import os
import sys
from dotenv import load_dotenv
from deepgram import DeepgramClient
from pathlib import Path

# Load environment variables from server/.env file
server_dir = Path(__file__).parent
env_path = server_dir / '.env'
load_dotenv(dotenv_path=env_path)

def check_deepgram_api_key():
    """Check if the Deepgram API key is set up correctly."""
    print("Checking Deepgram API key...")
    
    # Get the API key from environment variables
    api_key = os.getenv("DEEPGRAM_API_KEY")
    
    if not api_key:
        print("\n❌ ERROR: DEEPGRAM_API_KEY not found in environment variables.")
        print(f"Please set the DEEPGRAM_API_KEY environment variable in your .env file at: {env_path}")
        print("\nExample:")
        print("DEEPGRAM_API_KEY=your_deepgram_api_key_here")
        return False
    
    if api_key == "your_deepgram_api_key_here":
        print("\n❌ ERROR: You're using the placeholder API key.")
        print("Please replace it with your actual Deepgram API key in the .env file.")
        return False
    
    # Try to initialize the Deepgram client
    try:
        client = DeepgramClient(api_key)
        
        # Simply check if we can initialize the client without error
        print("\n✅ SUCCESS: Deepgram API key format is valid!")
        print(f"API key: {api_key[:5]}...{api_key[-5:]}")
        print("\nNote: This only checks if the API key format is valid.")
        print("To fully verify the key, try transcribing a video.")
        return True
    except Exception as e:
        print(f"\n❌ ERROR: Failed to initialize Deepgram client: {str(e)}")
        print("Please check your API key and internet connection.")
        return False

if __name__ == "__main__":
    success = check_deepgram_api_key()
    sys.exit(0 if success else 1) 