import datetime
from fastapi import APIRouter, Query, Depends
import json
import os
import subprocess
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import MarketPrice

router = APIRouter(prefix="/pricecharting", tags=["PriceCharting"])

@router.get("/result")
def get_pricecharting_result(
    version_en: str = Query(...),
    name_en: str = Query(...),
    card_number: str = Query(...),
    master_card_id: str = Query(...),
    db: Session = Depends(get_db)
):
    import decimal

    json_path = os.path.abspath("d:/Pokemon/backend/crawler/data.json")
    cmd = [
        "scrapy", "crawl", "pricecharting",
        "-a", f'version_en={version_en}',
        "-a", f'name_en={name_en}',
        "-a", f'card_number={card_number}',
        "-O", "data.json"
    ]
    cwd = os.path.abspath("d:/Pokemon/backend/crawler")
    subprocess.run(cmd, cwd=cwd, check=True)
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not data:
        return {"error": "No data crawled"}
    result = data[0]

    # Tách các trường giá (pricecharting_price)
    price_fields = {}
    for k, v in result.items():
        if (
            k.startswith("Ungraded") or
            k.startswith("Grade") or
            k.startswith("TAG") or
            k.startswith("ACE") or
            k.startswith("SGC") or
            k.startswith("CGC") or
            k.startswith("PSA") or
            k.startswith("BGS")
        ):
            price_fields[k] = _parse_decimal(v)

    # Tách các trường link/url
    url_fields = {k: v for k, v in result.items() if "link" in k.lower() or "url" in k.lower()}

    # Các trường giá chính
    ebay_price = _parse_decimal(result.get("eBay_price_table_1"))
    tcgplayer_price = _parse_decimal(result.get("TCGPlayer_price_table_1"))

    market_price = MarketPrice(
        master_card_id=master_card_id,
        tcgplayer_price=tcgplayer_price,
        ebay_avg_price=ebay_price,
        pricecharting_price=price_fields,  # giữ key và value
        price_date=datetime.date.today(),
        data_source="PriceCharting",
        urls=url_fields  # giữ key và value
    )
    db.add(market_price)
    db.commit()
    db.refresh(market_price)
    return market_price

def _parse_decimal(price_str):
    if not price_str or price_str == "-":
        return None
    try:
        return float(price_str.replace("$", "").replace(",", ""))
    except Exception:
        return None