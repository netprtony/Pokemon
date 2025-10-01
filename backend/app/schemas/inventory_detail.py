from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel

class DetailInventoryBase(BaseModel):
    detail_id: int
    inventory_id: int
    physical_condition_us: str
    physical_condition_jp: str
    is_graded: bool = False
    grade_company: Optional[str]
    grade_score: Optional[float]
    purchase_price: Optional[float]
    selling_price: Optional[float]
    card_photos: Optional[List[str]] = None
    photo_count: Optional[int]
    date_added: date
    last_updated: Optional[datetime]
    is_sold: bool = False
    notes: Optional[str]

class DetailInventoryCreate(BaseModel):
    inventory_id: int
    physical_condition_us: str
    physical_condition_jp: str
    is_graded: bool = False
    grade_company: Optional[str] = None
    grade_score: Optional[float] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    is_sold: bool = False
    card_photos: Optional[List[str]] = []
    photo_count: Optional[int] = 0
    date_added: date
    notes: Optional[str] = None

class DetailInventoryUpdate(BaseModel):
    physical_condition_us: Optional[str]
    physical_condition_jp: Optional[str]
    is_graded: Optional[bool]
    grade_company: Optional[str]
    grade_score: Optional[float]
    purchase_price: Optional[float]
    selling_price: Optional[float]
    card_photos: Optional[List[str]]
    photo_count: Optional[int]
    is_sold: Optional[bool]
    notes: Optional[str]
    last_updated: Optional[datetime]

class DetailInventoryOut(DetailInventoryBase):
    class Config:
        orm_mode = True

class PaginatedDetailInventory(BaseModel):
    items: List[DetailInventoryOut]
    total: int

