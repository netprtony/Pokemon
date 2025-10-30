import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import re
import time

SET_FILE = "backend/script_db/japan_pokemon_set.json"
OUTPUT_FILE = "backend/script_db/japan_pokemon_card.json"

def normalize_card_number(card_number):
    # card_number: "1 / 80" hoặc "1/80" -> "001/80"
    match = re.match(r"(\d+)\s*/\s*(\d+)", card_number)
    if match:
        left, right = match.groups()
        return f"{int(left):03d}/{right}"
    return card_number.strip()

def get_master_card_id(set_id, card_number):
    # card_number: "001/80" -> "001"
    num = card_number.split("/")[0]
    return f"{set_id}-{num}"

def crawl_cards_for_set(set_id):
    url = f"https://www.serebii.net/card/{set_id}/"
    print(f"Requesting: {url}")
    resp = requests.get(url)
    resp.raise_for_status()
    
    # Dùng html5lib để parse HTML không chuẩn tốt hơn
    # Nếu chưa cài: pip install html5lib
    soup = BeautifulSoup(resp.text, "html5lib")
    
    dextable = soup.find("table", class_="dextable")
    if not dextable:
        print(f"Không tìm thấy bảng card cho set {set_id}")
        return []
    
    # Lấy TẤT CẢ các <tr> (bao gồm cả tr lồng nhau)
    all_trs = dextable.find_all("tr")
    
    print(f"Found {len(all_trs)} <tr> in dextable for set {set_id}")
    
    # Lọc chỉ lấy các tr có đúng 4 td (bỏ header và các tr con)
    valid_trs = []
    for tr in all_trs:
        tds = tr.find_all("td", recursive=False)
        if len(tds) == 4:
            # Kiểm tra xem td[0] có chứa card number không
            td0_html = str(tds[0])
            if re.search(r"<br\s*/?>(\d+\s*/\s*\d+)", td0_html):
                valid_trs.append(tr)
    
    print(f"Found {len(valid_trs)} valid card rows")
    
    result = []
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    for idx, tr in enumerate(valid_trs, 1):
        tds = tr.find_all("td", recursive=False)
        
        # td[0]: card_number (lấy text sau <br>)
        td0_html = str(tds[0])
        card_number_match = re.search(r"<br\s*/?>([^<]+)", td0_html)
        if not card_number_match:
            print(f"Row {idx}: Bỏ qua - Không tìm thấy card_number")
            continue
        
        card_number_raw = card_number_match.group(1).strip()
        
        # Kiểm tra định dạng card_number (phải có dạng "số/số")
        if not re.match(r"\d+\s*/\s*\d+", card_number_raw):
            print(f"Row {idx}: Bỏ qua - card_number không đúng định dạng: '{card_number_raw}'")
            continue
        
        card_number = normalize_card_number(card_number_raw)
        
        # td[1]: reference_image_url, bỏ "th" nếu có trong src
        img_tag = tds[1].find("img")
        reference_image_url = None
        if img_tag and img_tag.get("src"):
            src = img_tag["src"]
            src = re.sub(r"/th/", "/", src)
            if src.startswith("http"):
                reference_image_url = src
            else:
                reference_image_url = "https://www.serebii.net" + src
        
        # td[2]: name_en trong <font>
        font_tag = tds[2].find("font")
        name_en = font_tag.text.strip() if font_tag else tds[2].get_text(strip=True)
        
        # Kiểm tra name_en không rỗng
        if not name_en:
            print(f"Row {idx}: Bỏ qua - name_en rỗng")
            continue
        
        master_card_id = get_master_card_id(set_id, card_number)
        print(f"Row {idx}: card_number={card_number}, name_en={name_en}, master_card_id={master_card_id}")
        
        item = {
            "master_card_id": master_card_id,
            "set_id": set_id,
            "card_number": card_number,
            "name_en": name_en,
            "name_original": None,
            "version_en": None,
            "version_original": None,
            "supertype": None,
            "subtypes": None,
            "rarity": None,
            "illustrator": None,
            "reference_image_url": reference_image_url,
            "flavorText": None,
            "updated_at": now_str
        }
        result.append(item)
    
    print(f"==> Tổng số card lấy được cho set {set_id}: {len(result)}")
    return result

def main():
    with open(SET_FILE, encoding="utf-8") as f:
        sets = json.load(f)
    all_cards = []
    for s in sets:
        set_id = s.get("set_id")
        if not set_id:
            continue
        print(f"\nCrawling set: {set_id}")
        try:
            cards = crawl_cards_for_set(set_id)
            all_cards.extend(cards)
            time.sleep(0.5)  # tránh bị chặn IP
        except Exception as e:
            print(f"Lỗi với set {set_id}: {e}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_cards, f, ensure_ascii=False, indent=2)
    print(f"\nĐã crawl xong {len(all_cards)} cards, lưu vào {OUTPUT_FILE}")

if __name__ == "__main__":
    main()