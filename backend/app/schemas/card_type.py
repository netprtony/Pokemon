from pydantic import BaseModel
from typing import List
from pagination_filter import PaginatedResponse


class CardTypeBase(BaseModel):
    card_id: str
    type_id: int

    class Config:
        from_attributes = True
class CardTypeCreate(CardTypeBase):
    pass
class CardTypeUpdate(CardTypeBase):
    pass
class CardTypeOut(CardTypeBase):
    pass

class CardTypePaginated(PaginatedResponse):
    items: List[CardTypeOut]