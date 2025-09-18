from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel

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
    card_photos: Optional[List[str]] = None
    photo_count: Optional[int]
    date_added: date
    last_updated: Optional[datetime]
    is_active: bool
    notes: Optional[str]
    language: Optional[str]
    is_graded: bool = False
    grade_company: Optional[str]
    grade_score: Optional[float]

class InventoryCreate(BaseModel):
    master_card_id: str
    quantity_in_stock: int
    purchase_price: float
    date_added: date
    physical_condition_us: str
    physical_condition_jp: str
    is_active: bool = True
    # Các trường khác là optional
    quantity_sold: Optional[int] = 0
    selling_price: Optional[float] = None
    storage_location: Optional[str] = None
    card_photos: Optional[List[str]] = None
    photo_count: Optional[int] = 0
    notes: Optional[str] = None
    language: Optional[str] = "EN"
    is_graded: bool = False
    grade_company: Optional[str] = None
    grade_score: Optional[float] = None

class InventoryUpdate(BaseModel):
    quantity_in_stock: Optional[int]
    quantity_sold: Optional[int]
    purchase_price: Optional[float]
    selling_price: Optional[float]
    storage_location: Optional[str]
    physical_condition_us: Optional[str]
    physical_condition_jp: Optional[str]
    card_photos: Optional[List[str]]
    photo_count: Optional[int]
    is_active: Optional[bool]
    notes: Optional[str]
    language: Optional[str]
    is_graded: Optional[bool]
    grade_company: Optional[str]
    grade_score: Optional[float]

class InventoryOut(InventoryBase):
    class Config:
        orm_mode = True

class PaginatedInventory(BaseModel):
    items: List[InventoryOut]
    total: int
