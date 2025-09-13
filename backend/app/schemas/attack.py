from typing import Optional
from pydantic import BaseModel
from typing import List
from .pagination_filter import PaginatedResponse
class AttackBase(BaseModel):
    attack_id: int
    card_id: str
    attack_name: str
    attack_cost: Optional[str] = None
    damage: Optional[str] = None
    attack_text: Optional[str] = None

    class Config:
        from_attributes = True

class AttackCreate(AttackBase):
    pass
class AttackUpdate(AttackBase):
    pass
class AttackOut(AttackBase):
    pass

class AttackPaginatedResponse(PaginatedResponse):
    items: List[AttackOut]