from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

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

class OrderCreate(BaseModel):
    order_date: date
    customer_name: Optional[str]
    customer_contact: Optional[str]
    order_status: str
    total_amount: float
    shipping_address: Optional[str]
    payment_method: Optional[str]
    platform: Optional[str]

class OrderUpdate(BaseModel):
    order_date: Optional[date]
    customer_name: Optional[str]
    customer_contact: Optional[str]
    order_status: Optional[str]
    total_amount: Optional[float]
    shipping_address: Optional[str]
    payment_method: Optional[str]
    platform: Optional[str]
    updated_at: Optional[datetime]

class OrderOut(OrderBase):
    class Config:
        orm_mode = True

class PaginatedOrders(BaseModel):
    items: List[OrderOut]
    total: int

    class Config:
        orm_mode = True