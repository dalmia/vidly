# Vidly Transcription Server

A FastAPI server that transcribes YouTube videos and streams the transcription to a frontend.

## Features

- Download audio from YouTube videos
- Transcribe audio using Deepgram
- Stream transcription results in real-time
- RESTful API for video transcription

## Prerequisites

- Python 3.8+
- Deepgram API key

## Installation

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy the `.env.example` file to `.env` and fill in your Deepgram API key:

```bash
cp .env.example .env
```

4. Edit the `.env` file and add your Deepgram API key:

```
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

5. Verify your environment setup:

```bash
# Check if environment variables are loaded correctly
./check_env.py

# Check if your Deepgram API key is valid
./check_api_key.py
```

## Troubleshooting

### DEEPGRAM_API_KEY not found in environment variables

If you see this error when starting the server or running the check scripts:

```
DEEPGRAM_API_KEY not found in environment variables
```

Make sure:
1. You have created a `.env` file in the `server` directory
2. The file contains your Deepgram API key in the format `DEEPGRAM_API_KEY=your_key_here`
3. You're running the server from the correct directory

You can run the `./check_env.py` script to verify that your environment variables are loaded correctly.

## Usage

### Starting the server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8002
```

### API Endpoints

#### Start Transcription

```
POST /api/transcribe
```

Request body:
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

Response:
```json
{
  "task_id": "dQw4w9WgXcQ",
  "status": "started"
}
```

#### Stream Transcription

```
GET /api/transcription/{video_id}/stream
```

This endpoint returns a Server-Sent Events (SSE) stream with transcription segments as they become available.

Events:
- `segment`: A new transcription segment
- `complete`: Transcription is complete
- `error`: An error occurred

#### Get Complete Transcription

```
GET /api/transcription/{video_id}
```

Response:
```json
{
  "segments": [
    {
      "text": "Hello and welcome to this video.",
      "start": 0,
      "end": 2.5
    },
    ...
  ],
  "fullText": "Hello and welcome to this video. Today we're going to talk about..."
}
```

## Frontend Integration

To connect to the streaming endpoint from a frontend:

```javascript
const eventSource = new EventSource(`http://localhost:8000/api/transcription/${videoId}/stream`);

eventSource.addEventListener('segment', (event) => {
  const segment = JSON.parse(event.data);
  console.log('New segment:', segment);
  // Update UI with new segment
});

eventSource.addEventListener('complete', () => {
  console.log('Transcription complete');
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  console.error('Error:', event.data);
  eventSource.close();
});
```

## License

MIT 