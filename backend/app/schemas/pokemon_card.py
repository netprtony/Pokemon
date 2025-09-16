from typing import List, Optional
from pydantic import BaseModel
from .filter import PaginatedResponse
class PokemonCardBase(BaseModel):
    master_card_id: str
    set_id: str
    card_number: str
    name_en: str
    name_original: Optional[str]
    version_en: Optional[str]
    version_original: Optional[str]
    supertype: str
    subtypes: Optional[str]
    hp: Optional[int]
    rarity: str
    illustrator: Optional[str]
    spec: Optional[str]
    reference_image_url: Optional[str]
    release_year: Optional[int]
    is_promo: bool = False
    is_special_variant: bool = False

class PaginatedPokemonCard(PaginatedResponse):
    items: List[PokemonCardBase]