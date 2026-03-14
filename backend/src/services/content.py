import random
from typing import Optional

from sqlalchemy.orm import Session

from ..models.content import ContentItem


def get_random_content(db: Session, exclude_id: Optional[int] = None) -> Optional[ContentItem]:
    query = db.query(ContentItem).filter(ContentItem.active == True)
    if exclude_id is not None:
        query = query.filter(ContentItem.id != exclude_id)
    items = query.all()
    if not items:
        return None
    return random.choice(items)
