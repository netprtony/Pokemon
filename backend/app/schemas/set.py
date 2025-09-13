from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from .pagination_filter import PaginatedResponse
class SetBase(BaseModel):
    set_id: str
    set_name: str
    series: Optional[str] = None
    release_date: Optional[date] = None
    total_cards: Optional[int] = None
    symbol_url: Optional[str] = None

    class Config:
        from_attributes = True

class SetCreate(SetBase):
    pass
class SetUpdate(SetBase):
    pass
class SetOut(SetBase):
    pass


class PaginatedSet(PaginatedResponse):
    items: List[SetOut]