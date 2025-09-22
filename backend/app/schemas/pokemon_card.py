from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

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
    rarity: str
    illustrator: Optional[str] = None
    reference_image_url: Optional[str] = None
    flavorText: Optional[str] = None
    updated_at: Optional[datetime] = None

class PokemonCardCreate(PokemonCardBase):
    pass

class PokemonCardUpdate(BaseModel):
    name_en: Optional[str] = None
    name_original: Optional[str] = None
    version_en: Optional[str] = None
    version_original: Optional[str] = None
    supertype: Optional[str] = None
    subtypes: Optional[str] = None
    rarity: Optional[str] = None
    illustrator: Optional[str] = None
    reference_image_url: Optional[str] = None
    flavorText: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class PokemonCardOut(PokemonCardBase):
    class Config:
        orm_mode = True

class PaginatedPokemonCard(BaseModel):
    items: List[PokemonCardOut]
    total: int