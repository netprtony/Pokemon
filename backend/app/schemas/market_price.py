from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class MarketPriceBase(BaseModel):
    price_id: int
    master_card_id: str
    tcgplayer_price: Optional[float]
    ebay_avg_price: Optional[float]
    pricecharting_price: Optional[Dict[str, Any]]  # hoặc Optional[str] nếu lưu JSON string
    cardrush_a_price: Optional[float]
    cardrush_b_price: Optional[float]
    snkrdunk_price: Optional[float]
    yahoo_auction_avg: Optional[float]
    usd_to_vnd_rate: Optional[float]
    jpy_to_vnd_rate: Optional[float]
    price_date: datetime
    data_source: Optional[str]
    url: Optional[Dict[str, Any]]  # hoặc Optional[str] nếu lưu JSON string

class MarketPriceCreate(BaseModel):
    master_card_id: str
    tcgplayer_price: Optional[float]
    ebay_avg_price: Optional[float]
    pricecharting_price: Optional[Dict[str, Any]]
    cardrush_a_price: Optional[float]
    cardrush_b_price: Optional[float]
    snkrdunk_price: Optional[float]
    yahoo_auction_avg: Optional[float]
    usd_to_vnd_rate: Optional[float]
    jpy_to_vnd_rate: Optional[float]
    price_date: datetime
    data_source: Optional[str]
    url: Optional[Dict[str, Any]]

class MarketPriceUpdate(BaseModel):
    tcgplayer_price: Optional[float]
    ebay_avg_price: Optional[float]
    pricecharting_price: Optional[Dict[str, Any]]
    cardrush_a_price: Optional[float]
    cardrush_b_price: Optional[float]
    snkrdunk_price: Optional[float]
    yahoo_auction_avg: Optional[float]
    usd_to_vnd_rate: Optional[float]
    jpy_to_vnd_rate: Optional[float]
    price_date: Optional[datetime]
    data_source: Optional[str]
    url: Optional[Dict[str, Any]]

class MarketPriceOut(MarketPriceBase):
    class Config:
        orm_mode = True

class PaginatedMarketPrice(BaseModel):
    items: List[MarketPriceOut]
    total: int

    class Config:
        orm_mode = True