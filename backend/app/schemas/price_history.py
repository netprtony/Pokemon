from pydantic import BaseModel
from typing import Optional
from datetime import date

class PriceHistoryBase(BaseModel):
    id: int
    card_id: str
    condition_type: Optional[str] = None
    price: float
    source: Optional[str] = None
    recorded_date: date

    class Config:
        from_attributes = True

class PriceHistoryCreate(PriceHistoryBase):
    pass
class PriceHistoryUpdate(PriceHistoryBase):
    pass
class PriceHistoryOut(PriceHistoryBase):
    pass

class PaginatedPriceHistory(BaseModel):
    items: list[PriceHistoryOut]