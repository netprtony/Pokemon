from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel

class InventoryBase(BaseModel):
    inventory_id: int
    master_card_id: str
    photo_avatar: Optional[str]
    total_quantity: int
    quantity_sold: Optional[int]
    avg_purchase_price: Optional[float]
    avg_selling_price: Optional[float]
    storage_location: Optional[str]
    language: Optional[str]
    is_active: bool
    date_added: date
    last_updated: Optional[datetime]
    notes: Optional[str]

class InventoryCreate(BaseModel):
    master_card_id: str
    total_quantity: int
    photo_avatar: Optional[str] = None
    quantity_sold: Optional[int] = 0
    avg_purchase_price: Optional[float] = None
    avg_selling_price: Optional[float] = None
    storage_location: Optional[str] = None
    language: Optional[str] = "EN"
    is_active: bool = True
    date_added: date
    notes: Optional[str] = None

class InventoryUpdate(BaseModel):
    total_quantity: Optional[int]
    quantity_sold: Optional[int]
    photo_avatar: Optional[str]
    avg_purchase_price: Optional[float]
    avg_selling_price: Optional[float]
    storage_location: Optional[str]
    language: Optional[str]
    is_active: Optional[bool]
    notes: Optional[str]

class InventoryOut(InventoryBase):
    class Config:
        orm_mode = True

class PaginatedInventory(BaseModel):
    items: List[InventoryOut]
    total: int
