from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from .database import Base


class ContentItem(Base):
    __tablename__ = "content_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    text = Column(Text, nullable=False)
    content_type = Column(String(50), nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
