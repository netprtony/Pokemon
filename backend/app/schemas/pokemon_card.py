from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class PokemonCardBase(BaseModel):
    master_card_id: str
    set_id: str
    card_number: str
    name_en: str
    name_original: Optional[str] = None
    version_en: Optional[str] = None
    version_original: Optional[str] = None
    supertype: str
    subtypes: Optional[str] = None
    hp: Optional[int] = None
    rarity: str
    illustrator: Optional[str] = None
    spec: Optional[str] = None
    reference_image_url: Optional[str] = None
    release_year: Optional[int] = None
    is_promo: bool = False
    is_special_variant: bool = False

class PokemonCardCreate(PokemonCardBase):
    pass

class PokemonCardUpdate(BaseModel):
    name_en: Optional[str] = None
    name_original: Optional[str] = None
    version_en: Optional[str] = None
    version_original: Optional[str] = None
    supertype: Optional[str] = None
    subtypes: Optional[str] = None
    hp: Optional[int] = None
    rarity: Optional[str] = None
    illustrator: Optional[str] = None
    spec: Optional[str] = None
    reference_image_url: Optional[str] = None
    release_year: Optional[int] = None
    is_promo: Optional[bool] = None
    is_special_variant: Optional[bool] = None

    class Config:
        orm_mode = True

class PokemonCardOut(PokemonCardBase):
    class Config:
        orm_mode = True

class PaginatedPokemonCard(BaseModel):
    items: List[PokemonCardOut]
    total: int