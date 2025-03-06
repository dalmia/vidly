from typing import List
from pydantic import BaseModel, Field


class SectionLLM(BaseModel):
    """A section of a video with title, timestamps, and summary points."""
    title: str = Field(..., description="The title of the section")
    start_index: int = Field(..., description="The start index of the segment that starts the section")
    end_index: int = Field(..., description="The end index of the segment that ends the section")
    summary: List[str] = Field(..., description="A list of bullet points summarizing the section content")


class VideoSectionsLLM(BaseModel):
    """A collection of video sections."""
    sections: List[SectionLLM] = Field(..., description="List of sections in the video") 


class Section(BaseModel):
    """A section of a video with title, timestamps, and summary points."""
    title: str = Field(..., description="The title of the section")
    start: str = Field(..., description="The start timestamp of the section (format: HH:MM:SS)")
    end: str = Field(..., description="The end timestamp of the section (format: HH:MM:SS)")
    summary: List[str] = Field(..., description="A list of bullet points summarizing the section content")


class AnswerQuestionLLM(BaseModel):
    """A response to a question from the user."""
    response: str = Field(..., description="The response to the question")
