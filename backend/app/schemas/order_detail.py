from typing import Optional, List
from pydantic import BaseModel

class OrderDetailBase(BaseModel):
    detail_id: int
    order_id: int
    inventory_id: int
    quantity_ordered: int
    unit_price: float
    subtotal: float

class OrderDetailCreate(BaseModel):
    order_id: int
    inventory_id: int
    quantity_ordered: int
    unit_price: float
    subtotal: float

class OrderDetailUpdate(BaseModel):
    quantity_ordered: Optional[int]
    unit_price: Optional[float]
    subtotal: Optional[float]

class OrderDetailOut(OrderDetailBase):
    class Config:
        orm_mode = True

class PaginatedOrderDetail(BaseModel):
    items: List[OrderDetailOut]
    total: int
