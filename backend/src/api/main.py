from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import uuid

from ..models.database import get_db, init_db
from ..models.content import ContentItem
from ..models.vote import Vote
from ..services.content import get_random_content


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="pua API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ContentResponse(BaseModel):
    id: int
    text: str
    content_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class VoteRequest(BaseModel):
    content_item_id: int = Field(..., description="ID of the content item voted on")
    vote_type: str = Field(..., description='"up" or "down"')
    session_id: str = Field(..., description="UUID of anonymous session")

    class Config:
        json_schema_extra = {
            "example": {
                "content_item_id": 1,
                "vote_type": "up",
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
            }
        }


class VoteResponse(BaseModel):
    id: int
    content_item_id: int
    vote_type: str
    session_id: str
    created_at: datetime

    class Config:
        from_attributes = True


DEBOUNCE_WINDOW_SECONDS = 1


@app.get("/api/content", response_model=ContentResponse)
def get_content(
    exclude_id: Optional[int] = Query(None, description="Content item ID to exclude"),
    db: Session = Depends(get_db),
):
    item = get_random_content(db, exclude_id)
    if item is None:
        raise HTTPException(status_code=404, detail="No content available")
    return item


@app.post("/api/votes", response_model=VoteResponse)
def create_vote(
    body: VoteRequest,
    db: Session = Depends(get_db),
):
    if body.vote_type not in ("up", "down"):
        raise HTTPException(
            status_code=400,
            detail="vote_type must be 'up' or 'down'",
        )
    try:
        uuid.UUID(body.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")

    cutoff = datetime.utcnow() - timedelta(seconds=DEBOUNCE_WINDOW_SECONDS)
    existing = (
        db.query(Vote)
        .filter(
            Vote.content_item_id == body.content_item_id,
            Vote.session_id == body.session_id,
            Vote.created_at >= cutoff,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=422, detail="Duplicate vote ignored")

    vote = Vote(
        content_item_id=body.content_item_id,
        vote_type=body.vote_type,
        session_id=body.session_id,
    )
    db.add(vote)
    try:
        db.commit()
        db.refresh(vote)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to persist vote")

    return vote
