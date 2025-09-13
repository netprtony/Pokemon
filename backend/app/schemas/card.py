from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from .pagination_filter import PaginatedResponse
class CardBase(BaseModel):
    card_id: str
    set_id: str
    card_number: str
    name: str
    supertype: Optional[str] = None
    subtypes: Optional[str] = None
    hp: Optional[int] = None
    rarity: Optional[str] = None
    artist: Optional[str] = None
    flavor_text: Optional[str] = None
    image_url: Optional[str] = None
    tcgplayer_url: Optional[str] = None
    cardmarket_url: Optional[str] = None

    class Config:
        from_attributes = True

class CardCreate(CardBase):
    pass
class CardUpdate(CardBase):
    pass
class CardOut(CardBase):
    pass


class PaginatedCard(PaginatedResponse):
    items: List[CardOut]