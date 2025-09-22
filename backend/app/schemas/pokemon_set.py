from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel


class PokemonSetBase(BaseModel):
    set_id: str
    set_name_en: str
    set_name_original: Optional[str] = None
    series: Optional[str] = None
    release_date: Optional[date] = None
    printed_total: Optional[int] = None
    total: Optional[int] = None
    ptcgo_code: Optional[str] = None
    image_symbol: Optional[str] = None
    updated_at: Optional[datetime] = None

class PokemonSetCreate(PokemonSetBase):
    pass

class PokemonSetUpdate(BaseModel):
    set_name_en: Optional[str] = None
    set_name_original: Optional[str] = None
    series: Optional[str] = None
    release_date: Optional[date] = None
    printed_total: Optional[int] = None
    total: Optional[int] = None
    ptcgo_code: Optional[str] = None
    image_symbol: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class PokemonSetOut(PokemonSetBase):
    class Config:
        orm_mode = True

class PaginatedPokemonSet(BaseModel):
    items: List[PokemonSetOut]
    total: int
    class Config:
        from_attributes = True

