from datetime import date
from typing import Optional, List
from pydantic import BaseModel

class PriceAlertBase(BaseModel):
    alert_id: int
    inventory_id: int
    alert_type: str
    purchase_price: Optional[float]
    current_market_price: Optional[float]
    price_difference: Optional[float]
    percentage_change: Optional[float]
    alert_message: Optional[str]
    alert_date: date
    is_acknowledged: bool

class PriceAlertCreate(BaseModel):
    inventory_id: int
    alert_type: str
    purchase_price: Optional[float]
    current_market_price: Optional[float]
    price_difference: Optional[float]
    percentage_change: Optional[float]
    alert_message: Optional[str]
    alert_date: date
    is_acknowledged: bool = False

class PriceAlertUpdate(BaseModel):
    alert_type: Optional[str]
    purchase_price: Optional[float]
    current_market_price: Optional[float]
    price_difference: Optional[float]
    percentage_change: Optional[float]
    alert_message: Optional[str]
    alert_date: Optional[date]
    is_acknowledged: Optional[bool]

class PriceAlertOut(PriceAlertBase):
    class Config:
        orm_mode = True

class PaginatedPriceAlert(BaseModel):
    items: List[PriceAlertOut]
    total: int