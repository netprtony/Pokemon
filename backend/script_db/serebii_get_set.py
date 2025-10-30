import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import re

URL = "https://www.serebii.net/card/japanese.shtml"
OUTPUT_FILE = "japan_pokemon_set.json"

def normalize_set_id(name):
    return name.lower().replace(" ", "")

def parse_release_date(date_str):
    # Xử lý dạng yyyy/mm/dd
    date_str = date_str.strip()
    if re.match(r"^\d{4}/\d{1,2}/\d{1,2}$", date_str):
        parts = date_str.split("/")
        return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
    # Xử lý dạng tiếng Anh: September 26th 2025
    match = re.match(r"([A-Za-z]+) (\d{1,2})(?:st|nd|rd|th)? (\d{4})", date_str)
    if match:
        month_str, day, year = match.groups()
        try:
            month = datetime.strptime(month_str, "%B").month
            return f"{year}-{str(month).zfill(2)}-{str(day).zfill(2)}"
        except Exception:
            pass
    return date_str

def main():
    resp = requests.get(URL)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    tables = soup.find_all("table")
    tbody = None
    # Ưu tiên table thứ 3, nếu không có thì lấy table đầu tiên có nhiều hơn 1 hàng dữ liệu
    if len(tables) >= 3:
        tbody = tables[2].find("tbody")
        table = tables[2]
    else:
        # fallback: lấy table đầu tiên có ít nhất 2 hàng tr
        table = next((tb for tb in tables if len(tb.find_all("tr")) > 1), None)
        if table:
            tbody = table.find("tbody")
    if not tbody and table:
        # Nếu không có tbody, dùng trực tiếp table
        trs = table.find_all("tr")
    elif tbody:
        trs = tbody.find_all("tr")
    else:
        print("Không tìm thấy bảng dữ liệu phù hợp")
        return

    result = []
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Bỏ qua header nếu có
    for tr in trs:
        tds = tr.find_all("td")
        if len(tds) < 4:
            continue

        # td[0]: <img>
        img_tag = tds[0].find("img")
        image_symbol = "https://www.serebii.net" + img_tag["src"] if img_tag and img_tag.get("src") else None

        # td[1]: set_name_en
        a_tag = tds[1].find("a")
        set_name_en = a_tag.text.strip() if a_tag else tds[1].text.strip()
        set_id = normalize_set_id(set_name_en)

        # td[2]: total
        total = tds[2].text.strip()
        try:
            total = int(total)
        except Exception:
            total = None

        # td[3]: release_date
        a_tag_date = tds[3].find("a")
        release_date_raw = a_tag_date.text.strip() if a_tag_date else tds[3].text.strip()
        release_date = parse_release_date(release_date_raw)

        item = {
            "set_id": set_id,
            "set_name_en": set_name_en,
            "set_name_original": None,
            "series": None,
            "release_date": release_date,
            "printed_total": None,
            "total": total,
            "ptcgo_code": None,
            "image_symbol": image_symbol,
            "updated_at": now_str
        }
        result.append(item)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Đã crawl và lưu {len(result)} bộ set vào {OUTPUT_FILE}")

if __name__ == "__main__":
    main()