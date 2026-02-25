from models import JobOpportunity
from schemas import JobOpportunityOut


def build_opportunity_out(opp: JobOpportunity) -> JobOpportunityOut:
    news = opp.news_item
    return JobOpportunityOut(
        id=opp.id,
        aspiration_id=opp.aspiration_id,
        news_item_id=opp.news_item_id,
        company=opp.company,
        role_hint=opp.role_hint,
        summary=opp.summary,
        urgency=opp.urgency,
        next_steps=opp.next_steps,
        relevance_score=opp.relevance_score,
        created_at=opp.created_at,
        news_source_type=news.source_type if news else None,
        news_source_url=news.source_url if news else None,
    )
