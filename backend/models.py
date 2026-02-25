from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class CareerAspiration(Base):
    __tablename__ = "career_aspirations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    opportunities = relationship(
        "JobOpportunity",
        back_populates="aspiration",
        cascade="all, delete-orphan",
    )


class NewsItem(Base):
    __tablename__ = "news_items"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String, nullable=False)   # "url" | "text" | "image"
    source_url = Column(String, nullable=True)
    raw_content = Column(Text, nullable=False)     # extracted text
    image_b64 = Column(Text, nullable=True)        # base64 for image items
    image_media_type = Column(String, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    opportunities = relationship(
        "JobOpportunity",
        back_populates="news_item",
        cascade="all, delete-orphan",
    )


class JobOpportunity(Base):
    __tablename__ = "job_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    aspiration_id = Column(Integer, ForeignKey("career_aspirations.id"), nullable=False)
    news_item_id = Column(Integer, ForeignKey("news_items.id"), nullable=False)
    company = Column(String, nullable=True)
    role_hint = Column(String, nullable=True)
    summary = Column(Text, nullable=False)
    urgency = Column(String, nullable=False)       # "apply_now" | "watch_space" | "informational"
    next_steps = Column(Text, nullable=False)
    relevance_score = Column(Float, nullable=False, default=0.5)
    created_at = Column(DateTime, default=datetime.utcnow)

    aspiration = relationship("CareerAspiration", back_populates="opportunities")
    news_item = relationship("NewsItem", back_populates="opportunities")


class ReprocessingJob(Base):
    """Tracks background reprocessing state across server restarts."""
    __tablename__ = "reprocessing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    is_running = Column(Integer, default=0)        # 0 = false, 1 = true
    total_items = Column(Integer, default=0)
    completed_items = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
