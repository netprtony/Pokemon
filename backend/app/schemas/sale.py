from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from .pagination_filter import PaginatedResponse
class SaleBase(BaseModel):
    sale_id: int
    inventory_id: int
    sale_price: float
    buyer_info: Optional[str] = None
    platform: Optional[str] = None
    sale_date: date
    fees: Optional[float] = 0
    shipping_cost: Optional[float] = 0
    profit: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class SaleCreate(SaleBase):
    pass
class SaleUpdate(SaleBase):
    pass
class SaleOut(SaleBase):
    pass


class PaginatedSale(PaginatedResponse):
    items: List[SaleOut]