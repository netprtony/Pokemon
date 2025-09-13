from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from .pagination_filter import PaginatedResponse
class InventoryBase(BaseModel):
    inventory_id: int
    card_id: str
    condition_type: Optional[str] = "Near Mint"
    language: Optional[str] = "EN"
    is_first_edition: bool = False
    is_shadowless: bool = False
    is_reverse_holo: bool = False
    is_holo: bool = False
    quantity: int
    purchase_price: Optional[float] = None
    current_market_price: Optional[float] = None
    purchase_date: Optional[date] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InventoryCreate(InventoryBase):
    pass
class InventoryUpdate(InventoryBase):   
    pass
class InventoryOut(InventoryBase):
    pass


class PaginatedInventory(PaginatedResponse):
    items: List[InventoryOut]