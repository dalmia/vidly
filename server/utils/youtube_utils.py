import re
import logging

logger = logging.getLogger(__name__)

def extract_youtube_video_id(url: str) -> str:
    """
    Extract the video ID from a YouTube URL.
    
    Args:
        url: The YouTube URL
        
    Returns:
        The video ID or None if the URL is invalid
    """
    # Regular expressions for different YouTube URL formats
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^&\n?#]+)',
        r'(?:youtube\.com\/shorts\/)([^&\n?#]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    logger.warning(f"Could not extract video ID from URL: {url}")
    return None

def is_valid_youtube_url(url: str) -> bool:
    """
    Check if a URL is a valid YouTube URL.
    
    Args:
        url: The URL to check
        
    Returns:
        True if the URL is a valid YouTube URL, False otherwise
    """
    return extract_youtube_video_id(url) is not None

def get_youtube_thumbnail_url(video_id: str, quality: str = 'high') -> str:
    """
    Get the URL of a YouTube video thumbnail.
    
    Args:
        video_id: The YouTube video ID
        quality: The thumbnail quality ('default', 'medium', 'high', 'standard', 'maxres')
        
    Returns:
        The URL of the thumbnail
    """
    quality_map = {
        'default': 'default',
        'medium': 'mqdefault',
        'high': 'hqdefault',
        'standard': 'sddefault',
        'maxres': 'maxresdefault'
    }
    
    quality_suffix = quality_map.get(quality, 'hqdefault')
    return f"https://img.youtube.com/vi/{video_id}/{quality_suffix}.jpg" 