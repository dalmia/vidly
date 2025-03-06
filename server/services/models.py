from typing import List
from pydantic import BaseModel, Field


class Section(BaseModel):
    """A section of a video with title, timestamps, and summary points."""
    title: str = Field(..., description="The title of the section")
    start: str = Field(..., description="The start timestamp of the section (format: HH:MM:SS)")
    end: str = Field(..., description="The end timestamp of the section (format: HH:MM:SS)")
    summary: List[str] = Field(..., description="A list of bullet points summarizing the section content")


class VideoSections(BaseModel):
    """A collection of video sections."""
    sections: List[Section] = Field(..., description="List of sections in the video") 