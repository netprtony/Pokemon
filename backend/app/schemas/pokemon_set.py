from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PokemonSetBase(BaseModel):
    set_id: str
    set_name_en: str
    set_name_original: Optional[str] = None
    series: Optional[str] = None
    release_year: int
    total_cards: Optional[int] = None
    set_symbol_url: Optional[str] = None
    region: Optional[str] = None
    series_order: Optional[int] = None
    created_at: Optional[datetime] = None

class PokemonSetCreate(PokemonSetBase):
    pass
class PokemonSetUpdate(BaseModel):
    set_name_en: Optional[str] = None
    set_name_original: Optional[str] = None
    series: Optional[str] = None
    release_year: Optional[int] = None
    total_cards: Optional[int] = None
    set_symbol_url: Optional[str] = None
    region: Optional[str] = None
    series_order: Optional[int] = None

    class Config:
        orm_mode = True

class PokemonSetOut(BaseModel):
    set_id: str
    set_name_en: str
    set_name_original: str | None
    series: str | None
    release_year: int
    total_cards: int | None
    set_symbol_url: str | None
    region: str | None
    series_order: int | None
    created_at: datetime | None

    class Config:
        from_attributes = True  # quan trọng để convert SQLAlchemy -> Pydantic
        orm_mode = True
        
class PaginatedPokemonSet(BaseModel):
    items: List[PokemonSetOut]
    total: int
    class Config:
        from_attributes = True

