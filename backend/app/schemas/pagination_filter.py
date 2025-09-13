from pydantic import BaseModel
from typing import List



# ------------------- FILTER & PAGINATION -------------------
class Filter(BaseModel):
    field: str
    operator: str
    value: str


class FilterRequest(BaseModel):
    filters: List[Filter] = []


class Pagination(BaseModel):
    page: int = 1
    page_size: int = 10


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int