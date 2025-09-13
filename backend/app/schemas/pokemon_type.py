from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from .pagination_filter import PaginatedResponse
class PokemonTypeBase(BaseModel):
    type_id: int
    type_name: str

    class Config:
        from_attributes = True

class PokemonTypeCreate(PokemonTypeBase):
    pass
class PokemonTypeUpdate(PokemonTypeBase):
    pass
class PokemonTypeOut(PokemonTypeBase):
    pass

class PaginatedPokemonType(PaginatedResponse):
    items: List[PokemonTypeOut]