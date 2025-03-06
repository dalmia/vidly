#!/bin/bash

# Start the FastAPI server
echo "Starting FastAPI server..."
cd server
python -m uvicorn main:app --host 0.0.0.0 --port 8002 &
FASTAPI_PID=$!

# Start the frontend
echo "Starting frontend..."
cd ..
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
function cleanup {
  echo "Shutting down servers..."
  kill $FASTAPI_PID
  kill $FRONTEND_PID
  exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Keep the script running
echo "Development servers are running. Press Ctrl+C to stop."
echo "Backend API: http://localhost:8002"
echo "Frontend: http://localhost:8081"
wait 