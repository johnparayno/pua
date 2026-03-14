from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from .database import Base


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    content_item_id = Column(Integer, ForeignKey("content_items.id"), nullable=False)
    vote_type = Column(String(10), nullable=False)
    session_id = Column(String(36), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
