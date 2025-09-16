from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import date, datetime
from enum import Enum

# =========================
# COMMON SCHEMAS
# =========================

class Filter(BaseModel):
    field: str          # tên cột
    operator: str       # eq, ne, lt, gt, like, in, between
    value: Any

class FilterRequest(BaseModel):
    filters: List[Filter] = []




