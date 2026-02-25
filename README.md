# Job Opportunity Tracker

A personal tool that uses Claude AI to monitor news and surface career opportunities aligned with your goals. Paste URLs, text, or images — Claude analyzes the content and maps it to your career aspirations with actionable next steps.

## Features

- **Career goals setup** — Define one or multiple roles/paths you want to target
- **Multi-format news input** — Submit news via URL, pasted text, or image screenshot
- **AI-powered analysis** — Claude identifies job opportunities, assesses urgency, and suggests next steps
- **Smart dashboard** — Opportunities grouped by career goal with relevance scoring
- **Automatic re-analysis** — Update your goals and all past news is re-analyzed automatically

## Tech Stack

- **Backend**: Python + FastAPI + SQLite (SQLAlchemy)
- **Frontend**: React + Vite
- **AI**: Claude claude-sonnet-4-6 via Anthropic SDK

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- An Anthropic API key

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env file
cp ../.env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.
Swagger UI: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Usage

1. **Set career goals** — Click "Career Goals" and add the roles you're targeting (e.g. "Senior Product Manager", "ML Engineer"). Add descriptions for more precise matching.

2. **Submit news daily** — Click "Submit News" and paste a URL, article text, or upload a screenshot. Claude will analyze it and find relevant opportunities.

3. **Review your dashboard** — Click "Dashboard" to see all opportunities grouped by career goal. Filter by urgency (Apply Now / Watch Space / Informational).

4. **Update goals anytime** — Edit or add career goals. All previously submitted news will be automatically re-analyzed against your new goals.

## Project Structure

```
job_opp_tracker/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings (reads .env)
│   ├── database.py          # SQLAlchemy + SQLite setup
│   ├── models.py            # ORM models
│   ├── schemas.py           # Pydantic schemas
│   ├── routers/
│   │   ├── aspirations.py   # Career goals CRUD
│   │   ├── news.py          # News submission (URL/text/image)
│   │   └── opportunities.py # Dashboard + reprocessing status
│   ├── services/
│   │   ├── content_fetcher.py  # URL scraping, image handling
│   │   ├── llm_analyzer.py     # Claude API integration
│   │   └── reprocessor.py      # Background re-analysis
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/client.js       # API layer
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── OpportunityCard.jsx
│   │   │   └── ReprocessingBanner.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── SubmitNews.jsx
│   │       └── Aspirations.jsx
│   └── package.json
└── .env.example
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/aspirations` | List career goals |
| POST | `/api/v1/aspirations` | Add career goal |
| PUT | `/api/v1/aspirations/{id}` | Update career goal (triggers reprocess) |
| DELETE | `/api/v1/aspirations/{id}` | Delete career goal |
| POST | `/api/v1/news/url` | Submit news URL |
| POST | `/api/v1/news/text` | Submit text content |
| POST | `/api/v1/news/image` | Upload image |
| GET | `/api/v1/dashboard` | Full opportunity dashboard |
| GET | `/api/v1/dashboard/reprocessing/status` | Reprocessing job status |
