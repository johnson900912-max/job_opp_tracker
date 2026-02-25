from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import engine, Base
from routers import aspirations, news, opportunities, opportunities_crud

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Job Opportunity Tracker",
    description="Track job opportunities from news using Claude AI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(aspirations.router, prefix="/api/v1/aspirations", tags=["aspirations"])
app.include_router(news.router, prefix="/api/v1/news", tags=["news"])
app.include_router(opportunities.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(opportunities_crud.router, prefix="/api/v1/opportunities", tags=["opportunities"])


@app.get("/api/v1/health", tags=["health"])
async def health():
    return {"status": "ok"}
