
from pydantic import BaseModel

from typing import List, Optional
from datetime import date
from .filter import PaginatedResponse
class MarketPriceBase(BaseModel):
    price_id: int
    master_card_id: str
    tcgplayer_nm_price: Optional[float]
    tcgplayer_lp_price: Optional[float]
    ebay_avg_price: Optional[float]
    pricecharting_price: Optional[float]
    cardrush_a_price: Optional[float]
    cardrush_b_price: Optional[float]
    snkrdunk_price: Optional[float]
    yahoo_auction_avg: Optional[float]
    usd_to_vnd_rate: Optional[float]
    jpy_to_vnd_rate: Optional[float]
    price_date: date
    data_source: Optional[str]

class PaginatedMarketPrice(PaginatedResponse):
    items: List[MarketPriceBase]