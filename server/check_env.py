#!/usr/bin/env python3
"""
Check if environment variables are properly loaded from the .env file.
"""

import os
import sys
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from server/.env file
server_dir = Path(__file__).parent
env_path = server_dir / '.env'
load_dotenv(dotenv_path=env_path)

def check_environment_variables():
    """Check if environment variables are properly loaded."""
    print(f"Checking environment variables from: {env_path}")
    
    # Check if .env file exists
    if not env_path.exists():
        print(f"\n❌ ERROR: .env file not found at {env_path}")
        print("Please create a .env file based on the .env.example file.")
        return False
    
    # Check for required environment variables
    required_vars = ["DEEPGRAM_API_KEY"]
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
        else:
            # Show first and last 5 characters of the value for security
            masked_value = f"{value[:5]}...{value[-5:]}" if len(value) > 10 else "***"
            print(f"✅ {var}: {masked_value}")
    
    if missing_vars:
        print("\n❌ ERROR: The following required environment variables are missing:")
        for var in missing_vars:
            print(f"  - {var}")
        print("\nPlease add them to your .env file.")
        return False
    
    # Check for optional environment variables
    optional_vars = ["PORT", "HOST", "CORS_ORIGINS", "LOG_LEVEL"]
    
    print("\nOptional environment variables:")
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {value}")
        else:
            print(f"⚠️ {var}: Not set (will use default value)")
    
    print("\n✅ Environment variables check completed successfully!")
    return True

if __name__ == "__main__":
    success = check_environment_variables()
    sys.exit(0 if success else 1) 