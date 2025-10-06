from fastapi import APIRouter, Query
import json
import os
import subprocess

router = APIRouter(prefix="/pricecharting", tags=["PriceCharting"])

@router.get("/result")
def get_pricecharting_result(
    version_en: str = Query(...),
    name_en: str = Query(...),
    card_number: str = Query(...)
):
    # Đường dẫn file json
    json_path = os.path.abspath("d:/Pokemon/backend/crawler/data.json")
    # Lệnh scrapy
    cmd = [
        "scrapy", "crawl", "pricecharting",
        "-a", f'version_en={version_en}',
        "-a", f'name_en={name_en}',
        "-a", f'card_number={card_number}',
        "-O", "data.json"
    ]
    # Thư mục chạy lệnh
    cwd = os.path.abspath("d:/Pokemon/backend/crawler")
    # Chạy lệnh Scrapy
    subprocess.run(cmd, cwd=cwd, check=True)
    # Đọc file json kết quả
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data