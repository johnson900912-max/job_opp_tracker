from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, HttpUrl


# --- Career Aspirations ---

class AspirationCreate(BaseModel):
    title: str
    description: Optional[str] = None


class AspirationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class AspirationOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- News Submission ---

class NewsSubmitURL(BaseModel):
    url: str   # validated as URL in the router


class NewsSubmitText(BaseModel):
    content: str


class NewsItemOut(BaseModel):
    id: int
    source_type: str
    source_url: Optional[str]
    raw_content: str
    submitted_at: datetime

    model_config = {"from_attributes": True}


# --- Job Opportunities ---

class JobOpportunityOut(BaseModel):
    id: int
    aspiration_id: int
    news_item_id: int
    company: Optional[str]
    role_hint: Optional[str]
    summary: str
    urgency: Literal["apply_now", "watch_space", "informational"]
    next_steps: str
    relevance_score: float
    created_at: datetime
    # Joined fields from NewsItem
    news_source_type: Optional[str] = None
    news_source_url: Optional[str] = None

    model_config = {"from_attributes": True}


# --- Dashboard ---

class AspirationDashboard(BaseModel):
    aspiration: AspirationOut
    opportunities: List[JobOpportunityOut]


class DashboardOut(BaseModel):
    panels: List[AspirationDashboard]


# --- Opportunity Updates ---

class UrgencyUpdate(BaseModel):
    urgency: Literal["apply_now", "watch_space", "informational"]


# --- Reprocessing ---

class ReprocessingStatus(BaseModel):
    is_running: bool
    total_items: int
    completed_items: int
    error_count: int
    started_at: Optional[datetime]
    finished_at: Optional[datetime]


# --- News Submission Response ---

class NewsSubmitResponse(BaseModel):
    news_item: NewsItemOut
    opportunities_created: int
    opportunities: List[JobOpportunityOut]
