import datetime
import os
import subprocess
import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.orm import Session
from app.schemas.market_price import (
    MarketPriceBase,
    MarketPriceCreate,
    MarketPriceUpdate,
    MarketPriceOut,
    PaginatedMarketPrice,
)
from app.schemas.filter import FilterRequest
from app.models import MarketPrice, PokemonCardMaster
from app.database import get_db
from dotenv import load_dotenv

load_dotenv()
ROOT_DIR = os.getenv("PROJECT_ROOT")

router = APIRouter(prefix="/market-price", tags=["Market Price"])

# Thêm mới
@router.post("/", response_model=MarketPriceOut, status_code=status.HTTP_201_CREATED)
def create_market_price(
    master_card_id: str = Query(...),
    url: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if not url:
    # Truy vấn thông tin card từ bảng master
        master_card = db.query(PokemonCardMaster).filter(
            PokemonCardMaster.master_card_id == master_card_id
        ).first()
        if not master_card:
            raise HTTPException(
                status_code=400,
                detail=f"master_card_id '{master_card_id}' does not exist in pokemon_cards_master"
            )
        version_en = getattr(master_card, "version_en", "")
        name_en = getattr(master_card, "name_en", "")
        card_number = getattr(master_card, "card_number", "")

        # Crawl dữ liệu từ PriceChartingSpider
        cmd = [
            "scrapy", "crawl", "pricecharting",
            "-a", f'version_en={version_en}',
            "-a", f'name_en={name_en}',
            "-a", f'card_number={card_number}',
            "-O", "data.json"
        ]
    else:
        # Crawl dữ liệu từ PriceChartingSpider với url trực tiếp
        cmd = [
            "scrapy", "crawl", "pricecharting",
            "-a", f'url={url}',
            "-O", "data.json"
        ]
    json_path = os.path.abspath(f"{ROOT_DIR}/backend/crawler/data.json")
    cwd = os.path.abspath(f"{ROOT_DIR}/backend/crawler")
    subprocess.run(cmd, cwd=cwd, check=True)
    with open(json_path, "r", encoding="utf-8") as f:
        crawled = json.load(f)
    if not crawled:
        raise HTTPException(status_code=400, detail="No data crawled")
    result = crawled[0]

    def _parse_decimal(price_str):
        if not price_str or price_str == "-":
            return None
        try:
            return float(price_str.replace("$", "").replace(",", ""))
        except Exception:
            return None

    price_fields = {
        k: _parse_decimal(v)
        for k, v in result.items()
        if (
            k.startswith("Ungraded") or
            k.startswith("Grade") or
            k.startswith("TAG") or
            k.startswith("ACE") or
            k.startswith("SGC") or
            k.startswith("CGC") or
            k.startswith("PSA") or
            k.startswith("BGS")
        )
    }
    url_fields = {k: v for k, v in result.items() if "link" in k.lower() or "url" in k.lower()}
    usd_to_vnd_rate = result.get("usd_to_vnd_rate")
    jpy_to_vnd_rate = result.get("jpy_to_vnd_rate")
    ebay_price = _parse_decimal(result.get("eBay_price_table_1"))
    tcgplayer_price = _parse_decimal(result.get("TCGPlayer_price_table_1"))

    db_item = MarketPrice(
        master_card_id=master_card_id,
        tcgplayer_price=tcgplayer_price,
        ebay_avg_price=ebay_price,
        pricecharting_price=price_fields,
        price_date=datetime.datetime.now(),
        data_source="PriceCharting",
        usd_to_vnd_rate=usd_to_vnd_rate,
        jpy_to_vnd_rate=jpy_to_vnd_rate,
        urls=url_fields
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    pricecharting_price = db_item.pricecharting_price
    if isinstance(pricecharting_price, str):
        try:
            pricecharting_price = json.loads(pricecharting_price)
        except Exception:
            pricecharting_price = None
    url = db_item.urls if hasattr(db_item, "urls") else db_item.url
    if isinstance(url, str):
        try:
            url = json.loads(url)
        except Exception:
            url = None
    return {
        "price_id": db_item.price_id,
        "master_card_id": db_item.master_card_id,
        "tcgplayer_price": db_item.tcgplayer_price,
        "ebay_avg_price": db_item.ebay_avg_price,
        "pricecharting_price": pricecharting_price,
        "cardrush_a_price": db_item.cardrush_a_price,
        "cardrush_b_price": db_item.cardrush_b_price,
        "snkrdunk_price": db_item.snkrdunk_price,
        "yahoo_auction_avg": db_item.yahoo_auction_avg,
        "usd_to_vnd_rate": db_item.usd_to_vnd_rate,
        "jpy_to_vnd_rate": db_item.jpy_to_vnd_rate,
        "price_date": db_item.price_date,
        "data_source": db_item.data_source,
        "url": url
    }

# Sửa
@router.put("/{price_id}", response_model=MarketPriceOut)
def update_market_price(price_id: int, data: MarketPriceUpdate, db: Session = Depends(get_db)):
    db_item = db.query(MarketPrice).filter(MarketPrice.price_id == price_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Market price not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

# Xóa
@router.delete("/{price_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_market_price(price_id: int, db: Session = Depends(get_db)):
    db_item = db.query(MarketPrice).filter(MarketPrice.price_id == price_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Market price not found")
    db.delete(db_item)
    db.commit()
    return

# Lấy danh sách phân trang
@router.get("/", response_model=PaginatedMarketPrice)
def get_market_prices(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    search: str = Query(None, description="Tìm kiếm theo master_card_id"),
    sort_field: Optional[str] = Query("price_date", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(MarketPrice)
    if search:
        query = query.filter(MarketPrice.master_card_id.ilike(f"%{search}%"))
    valid_sort_fields = {
        "price_id": MarketPrice.price_id,
        "master_card_id": MarketPrice.master_card_id,
        "price_date": MarketPrice.price_date,
        "tcgplayer_nm_price": MarketPrice.tcgplayer_nm_price,
        "ebay_avg_price": MarketPrice.ebay_avg_price,
    }
    if sort_field in valid_sort_fields:
        col = valid_sort_fields[sort_field]
        if sort_order == "desc":
            query = query.order_by(col.desc())
        else:
            query = query.order_by(col.asc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total}

# Lấy tất cả danh sách (không phân trang)
@router.get("/all", response_model=List[MarketPriceOut])
def get_all_market_prices(db: Session = Depends(get_db)):
    return db.query(MarketPrice).order_by(MarketPrice.price_date.desc()).all()

# Filter nâng cao
@router.post("/filter", response_model=PaginatedMarketPrice)
def filter_market_prices(
    filter_request: FilterRequest,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    sort_field: Optional[str] = Query("price_date", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(MarketPrice)
    valid_sort_fields = {
        "price_id": MarketPrice.price_id,
        "master_card_id": MarketPrice.master_card_id,
        "price_date": MarketPrice.price_date,
        "tcgplayer_nm_price": MarketPrice.tcgplayer_nm_price,
        "ebay_avg_price": MarketPrice.ebay_avg_price,
    }
    for filter in filter_request.filters:
        field = getattr(MarketPrice, filter.field, None)
        if field is not None:
            col_type = str(field.type)
            value = filter.value
            if "INTEGER" in col_type or "NUMERIC" in col_type or "FLOAT" in col_type:
                try:
                    value = float(value)
                except Exception:
                    continue
            if filter.operator == "eq":
                query = query.filter(field == value)
            elif filter.operator == "ne":
                query = query.filter(field != value)
            elif filter.operator == "lt":
                query = query.filter(field < value)
            elif filter.operator == "le":
                query = query.filter(field <= value)
            elif filter.operator == "gt":
                query = query.filter(field > value)
            elif filter.operator == "ge":
                query = query.filter(field >= value)
            elif filter.operator == "like":
                query = query.filter(field.ilike(f"%{value}%"))
    if sort_field in valid_sort_fields:
        col = valid_sort_fields[sort_field]
        if sort_order == "desc":
            query = query.order_by(col.desc())
        else:
            query = query.order_by(col.asc())
    total = query.order_by(None).count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total}



@router.get("/by-master/{master_card_id}", response_model=MarketPriceOut)
def get_market_price_by_master_card_id(master_card_id: str, db: Session = Depends(get_db)):
    db_item = (
        db.query(MarketPrice)
        .filter(MarketPrice.master_card_id == master_card_id)
        .order_by(MarketPrice.price_date.desc())
        .first()
    )
    if not db_item:
        raise HTTPException(status_code=404, detail="Market price not found")
    pricecharting_price = db_item.pricecharting_price
    if isinstance(pricecharting_price, str):
        try:
            pricecharting_price = json.loads(pricecharting_price)
        except Exception:
            pricecharting_price = None
    url = db_item.urls if hasattr(db_item, "urls") else db_item.url
    if isinstance(url, str):
        try:
            url = json.loads(url)
        except Exception:
            url = None
    return {
        "price_id": db_item.price_id,
        "master_card_id": db_item.master_card_id,
        "tcgplayer_price": db_item.tcgplayer_price,
        "ebay_avg_price": db_item.ebay_avg_price,
        "pricecharting_price": pricecharting_price,
        "cardrush_a_price": db_item.cardrush_a_price,
        "cardrush_b_price": db_item.cardrush_b_price,
        "snkrdunk_price": db_item.snkrdunk_price,
        "yahoo_auction_avg": db_item.yahoo_auction_avg,
        "usd_to_vnd_rate": db_item.usd_to_vnd_rate,
        "jpy_to_vnd_rate": db_item.jpy_to_vnd_rate,
        "price_date": db_item.price_date,
        "data_source": db_item.data_source,
        "url": url
    }