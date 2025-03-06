# Vidly

Transform YouTube from consumption to true learning.

## Installation

### Backend Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file from the example and add the environment variables:

```bash
cp .env.example .env
```

### Frontend Setup

1. Install Node.js dependencies:

```bash
npm install
```

## Running the Application

### Development Mode

You can run both the frontend and backend servers with a single command:

```bash
./start-dev.sh
```

Or run them separately:

#### Backend

```bash
cd server
python main.py
```

#### Frontend

```bash
npm run dev
```

### Accessing the Application

- Frontend: http://localhost:8081
- Backend API: http://localhost:8002
- API Documentation: http://localhost:8002/docs

## License

MIT
