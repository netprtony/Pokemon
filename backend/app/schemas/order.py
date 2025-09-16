from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel
from .filter import PaginatedResponse
class OrderBase(BaseModel):
    order_id: int
    order_date: date
    customer_name: Optional[str]
    customer_contact: Optional[str]
    order_status: str
    total_amount: float
    shipping_address: Optional[str]
    payment_method: Optional[str]
    platform: Optional[str]
    created_at: datetime
    updated_at: datetime

class PaginatedOrders(PaginatedResponse):
    items: List[OrderBase]