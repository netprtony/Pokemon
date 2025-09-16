from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel
from .filter import PaginatedResponse
class InventoryBase(BaseModel):
    inventory_id: int
    master_card_id: str
    quantity_in_stock: int
    quantity_sold: Optional[int]
    purchase_price: float
    selling_price: Optional[float]
    storage_location: Optional[str]
    physical_condition_us: str
    physical_condition_jp: str
    card_photos: Optional[List[str]]
    photo_count: Optional[int]
    date_added: date
    last_updated: datetime
    is_active: bool
    notes: Optional[str]
    language: Optional[str]
    is_graded: bool = False
    grade_company: Optional[str]
    grade_score: Optional[float]

class PaginatedInventory(PaginatedResponse):
    items: List[InventoryBase]
