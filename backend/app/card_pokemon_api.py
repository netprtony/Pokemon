import json
import time
from datetime import datetime
from pokemontcgsdk import Card, RestClient, Set
from requests.exceptions import RequestException
from dotenv import load_dotenv
import os
from sqlalchemy import text
import database

# Tải API Key từ file .env
load_dotenv()
POKEMONTCG_IO_API_KEY = os.getenv("POKEMONTCG_IO_API_KEY")
if not POKEMONTCG_IO_API_KEY:
    raise ValueError("POKEMONTCG_IO_API_KEY không được cấu hình trong .env")
RestClient.configure(POKEMONTCG_IO_API_KEY)

def convert_to_dict(obj):
    if isinstance(obj, list):
        return [convert_to_dict(item) for item in obj]
    if hasattr(obj, '__dict__'):
        return {key: convert_to_dict(value) for key, value in obj.__dict__.items()}
    return obj

# Khởi tạo session ở phạm vi toàn cục để sử dụng trong finally
session = next(database.get_db())  # SQLAlchemy Session

def fetch_and_save_cards():
    page = 31
    page_size = 250
    retries = 3
    delay = 5
    max_api_fail = 5
    api_fail_count = 0

    # Lấy danh sách set để kiểm tra set_id
    for attempt in range(retries):
        try:
            sets = Set.all()
            break
        except Exception as e:
            err_msg = e.decode() if isinstance(e, bytes) else (e if isinstance(e, str) else str(e).decode() if isinstance(str(e), bytes) else str(e))
            print(f"Lỗi khi lấy danh sách set: {err_msg}")
            time.sleep(delay)
    else:
        print("Không thể lấy danh sách set sau nhiều lần thử.")
        return

    set_ids = {s.id for s in sets}

    while True:
        try:
            cards = Card.where(page=page, pageSize=page_size)
            if not cards:
                break

            export_cards = []
            for idx, card in enumerate(cards):
                print(f"Xử lý thẻ {((page-1)*page_size)+idx+1}: {getattr(card, 'name', None)} (ID: {getattr(card, 'id', None)})")
                try:
                    set_id = getattr(card.set, 'id', None)
                    if not set_id or set_id not in set_ids:
                        continue

                    master_card_id = getattr(card, 'id', None)
                    card_number = f"{getattr(card, 'number', '')}/{getattr(card.set, 'total', '')}"
                    name_en = getattr(card, 'name', '') or 'Unknown'
                    name_original = None
                    version_en = getattr(card.set, 'name', None)
                    if getattr(card, 'number', '') and '1st Edition' in getattr(card, 'number', ''):
                        version_en = (version_en or '') + ' 1st Edition'
                    elif getattr(card, 'rarity', '') and 'Shadowless' in getattr(card, 'rarity', ''):
                        version_en = (version_en or '') + ' Shadowless'
                    version_original = None
                    supertype = getattr(card, 'supertype', '') or 'Pokemon'
                    subtypes = ','.join(card.subtypes) if getattr(card, 'subtypes', None) else None
                    rarity = getattr(card, 'rarity', '') or 'Unknown'
                    illustrator = getattr(card, 'artist', None)
                    reference_image_url = getattr(card.images, 'large', None) if getattr(card, 'images', None) else None
                    flavorText = getattr(card, 'flavorText', None)
                    updated_at = None
                    if getattr(card, 'set', None) and getattr(card.set, 'updatedAt', None):
                        try:
                            updated_at = datetime.strptime(card.set.updatedAt, '%Y/%m/%d %H:%M:%S').strftime('%H:%M %d/%m/%Y')
                        except Exception as e:
                            print(f"Lỗi ở trường updated_at, card_id={master_card_id}, giá trị={card.set.updatedAt}: {e}")
                            updated_at = None

                    export_cards.append({
                        "master_card_id": master_card_id,
                        "set_id": set_id,
                        "card_number": card_number,
                        "name_en": name_en,
                        "name_original": name_original,
                        "version_en": version_en,
                        "version_original": version_original,
                        "supertype": supertype,
                        "subtypes": subtypes,
                        "rarity": rarity,
                        "illustrator": illustrator,
                        "reference_image_url": reference_image_url,
                        "flavorText": flavorText,
                        "updated_at": updated_at
                    })
                except Exception as e:
                    print(f"Lỗi ở dòng {idx+1} trang {page}, card_id={getattr(card, 'id', None)}: {e}")
                    continue

            # Xuất file JSON cho trang hiện tại
            out_path = f"backend/script_db/pokemon_cards_master_page_{page}.json"
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(export_cards, f, ensure_ascii=False, indent=2)

            print(f"Đã xuất {len(export_cards)} thẻ ra {out_path}")
            page += 1
            time.sleep(1)
            api_fail_count = 0  # reset nếu thành công

        except RequestException as e:
            print(f"Lỗi tại trang {page}: {e}")
            api_fail_count += 1
            if api_fail_count >= max_api_fail:
                print("API gặp lỗi liên tục, dừng chương trình.")
                break
            print(f"Bỏ qua trang {page} do lỗi, chuyển sang trang tiếp theo.")
            page += 1
            time.sleep(delay)

        except Exception as e:
            print(f"Lỗi không xác định tại trang {page}: {e}")
            api_fail_count += 1
            if api_fail_count >= max_api_fail:
                print("API gặp lỗi liên tục, dừng chương trình.")
                break
            print(f"Bỏ qua trang {page} do lỗi, chuyển sang trang tiếp theo.")
            page += 1
            time.sleep(delay)

try:
    fetch_and_save_cards()
finally:
    session.close()