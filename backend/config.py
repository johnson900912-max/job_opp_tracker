from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    anthropic_api_key: str
    database_url: str = "sqlite:///./job_tracker.db"
    cors_origins: List[str] = ["http://localhost:5173"]
    max_content_length: int = 8000
    max_image_size_bytes: int = 5_242_880

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
