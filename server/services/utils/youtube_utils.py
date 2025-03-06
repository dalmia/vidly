import re
from urllib.parse import urlparse, parse_qs

def extract_youtube_video_id(url: str) -> str:
    """
    Extract the video ID from a YouTube URL.
    
    Args:
        url: The YouTube URL
        
    Returns:
        The video ID
    """
    # Regular expression patterns for different YouTube URL formats
    patterns = [
        r'^https?://(?:www\.)?youtube\.com/watch\?(?=.*v=([a-zA-Z0-9_-]{11})).*$',  # Standard watch URL
        r'^https?://(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11}).*$',  # Embed URL
        r'^https?://(?:www\.)?youtube\.com/v/([a-zA-Z0-9_-]{11}).*$',  # Old embed URL
        r'^https?://(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11}).*$',  # Shorts URL
        r'^https?://youtu\.be/([a-zA-Z0-9_-]{11}).*$'  # Shortened URL
    ]
    
    # Try each pattern
    for pattern in patterns:
        match = re.match(pattern, url)
        if match:
            return match.group(1)
    
    # If no pattern matches, try parsing the URL
    parsed_url = urlparse(url)
    if parsed_url.netloc in ('youtube.com', 'www.youtube.com'):
        query_params = parse_qs(parsed_url.query)
        if 'v' in query_params:
            return query_params['v'][0]
    
    # If all else fails, return None
    return None 