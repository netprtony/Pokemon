from pydantic import BaseModel
from typing import Optional
from typing import List
from .pagination_filter import PaginatedResponse
class WeaknessResistanceBase(BaseModel):
    id: int
    card_id: str
    type: str  # weakness / resistance
    element: str
    value: Optional[str] = None

    class Config:
        from_attributes = True

class WeaknessResistanceCreate(WeaknessResistanceBase):
    pass
class WeaknessResistanceUpdate(WeaknessResistanceBase):
    pass
class WeaknessResistanceOut(WeaknessResistanceBase):
    pass

class PaginatedWeaknessResistance(PaginatedResponse):
    items: list[WeaknessResistanceOut]