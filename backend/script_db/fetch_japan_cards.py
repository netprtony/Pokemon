import json
from tcgdexsdk import TCGdex, Language
from time import sleep
import requests
import os

tcgdex = TCGdex(Language.JA)

with open('d:/Pokemon/backend/script_db/japan_pokemon_card.json', encoding='utf-8') as f:
    data = json.load(f)

# Tùy chọn: lấy hết nếu limit=None, hoặc lấy số lượng limit đầu tiên
limit = None  # Đặt số lượng muốn lấy, ví dụ: 10. Để lấy hết thì để None
if limit is not None:
    data = data[:limit]

results = []
failed_cards = []

IMAGE_DIR = 'd:/Pokemon/backend/script_db/image_card_ja'
os.makedirs(IMAGE_DIR, exist_ok=True)

def deep_to_dict(obj):
    """Đệ quy chuyển mọi object lồng sang dict hoặc list để có thể dump ra JSON."""
    if isinstance(obj, dict):
        return {k: deep_to_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [deep_to_dict(i) for i in obj]
    elif hasattr(obj, "__dict__"):
        return {k: deep_to_dict(v) for k, v in obj.__dict__.items()}
    else:
        return obj

def safe_card_info(card_obj, card_id, name, image_url=None):
    """Chuyển object card sang dict, trường nào thiếu thì để None, thêm trường reference_image_url."""
    fields = [
        "category", "id", "localId", "name", "rarity", "set", "variants",
        "variants_detailed", "dexId", "hp", "types", "stage", "attacks",
        "retreat", "legal", "updated", "pricing"
    ]
    info = {}
    for field in fields:
        value = getattr(card_obj, field, None)
        info[field] = deep_to_dict(value)
    info["id"] = card_id
    info["name"] = name
    info["reference_image_url"] = image_url if image_url else None
    return info

def download_image(img_data, card_id):
    import cv2
    import numpy as np
    import base64
    import requests
    from PIL import Image

    file_path = os.path.join(IMAGE_DIR, f"{card_id}.webp")
    try:
        # decode bytes / url / base64 / file-like / PIL Image
        
        if isinstance(img_data, (bytes, bytearray)):
            buf = np.frombuffer(img_data, dtype=np.uint8)
            img = cv2.imdecode(buf, cv2.IMREAD_UNCHANGED)
            cv2.imwrite(file_path, img)
        elif isinstance(img_data, str):
            if img_data.startswith("http://") or img_data.startswith("https://"):
                resp = requests.get(img_data)
                resp.raise_for_status()
                buf = np.frombuffer(resp.content, dtype=np.uint8)
                img = cv2.imdecode(buf, cv2.IMREAD_UNCHANGED)
                cv2.imwrite(file_path, img)
            else:
                b = base64.b64decode(img_data)
                buf = np.frombuffer(b, dtype=np.uint8)
                img = cv2.imdecode(buf, cv2.IMREAD_UNCHANGED)
                cv2.imwrite(file_path, img)
        elif hasattr(img_data, "read"):
            b = img_data.read()
            buf = np.frombuffer(b, dtype=np.uint8)
            img = cv2.imdecode(buf, cv2.IMREAD_UNCHANGED)
            cv2.imwrite(file_path, img)
        elif isinstance(img_data, Image.Image):
            pil = img_data.convert("RGBA") if img_data.mode in ("LA","RGBA") else img_data.convert("RGB")
            arr = np.array(pil)
            if arr.shape[2] == 3:
                img = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
            else:
                img = cv2.cvtColor(arr, cv2.COLOR_RGBA2BGRA)
            cv2.imwrite(file_path, img)
        else:
            print(f"  -> Unsupported image format: {type(img_data)}")
            with open('d:/Pokemon/backend/script_db/image_download_failed.log', 'a', encoding='utf-8') as logf:
                logf.write(f"{card_id}: Unsupported image format: {type(img_data)}\n")
            return
        print(f"  -> Đã tải ảnh cho card {card_id} vào {file_path}")
    except Exception as e:
        print(f"  -> Lỗi tải ảnh cho card {card_id}: {e}")
        with open('d:/Pokemon/backend/script_db/image_download_failed.log', 'a', encoding='utf-8') as logf:
            logf.write(f"{card_id}: {e}\n")

for idx, entry in enumerate(data, 1):
    print(f"[{idx}/{len(data)}] Đang xử lý card: {entry.get('name', 'Unknown')}, id: {entry.get('id', 'N/A')}")
    if 'id' in entry and 'name' in entry:
        card_id = entry['id']
        name = entry['name']
        success = False
        try:
            card_obj = tcgdex.card.getSync(card_id)
            # Lấy URL ảnh từ SDK nếu có
            image_url = None
            if hasattr(card_obj, "get_image_url"):
                try:
                    image_url = card_obj.get_image_url()
                except Exception:
                    image_url = None
            card_info = safe_card_info(card_obj, card_id, name, image_url) if card_obj else None
            if card_info and card_info.get('rarity') is not None:
                results.append(card_info)
                print(f"  -> Thành công: Đã lấy thông tin card {card_id} bằng SDK")
                success = True
                # Tải ảnh
                if image_url:
                    download_image(image_url, card_id)
            else:
                raise ValueError('missing value for field "rarity"')
        except Exception as e:
            print(f"  -> Lỗi với card {card_id}: {e}")
            if 'missing value for field "rarity"' in str(e) or "maximum recursion depth" in str(e):
                api_url = f"https://api.tcgdex.net/v2/ja/cards/{card_id}"
                print(f"  -> Đang gọi lại API: {api_url}")
                try:
                    resp = requests.get(api_url)
                    if resp.status_code == 200:
                        card_info = resp.json()
                        # Đảm bảo trường nào thiếu thì để None
                        for field in [
                            "category", "id", "localId", "name", "rarity", "set", "variants",
                            "variants_detailed", "dexId", "hp", "types", "stage", "attacks",
                            "retreat", "legal", "updated", "pricing"
                        ]:
                            if field not in card_info:
                                card_info[field] = None
                        card_info['id'] = card_id
                        card_info['name'] = name
                        card_info['reference_image_url'] = card_info.get('image', None) if 'image' in card_info else None
                        results.append(card_info)
                        print(f"  -> Thành công: Đã lấy thông tin card {card_id} bằng API")
                        success = True
                    else:
                        print(f"  -> Không tìm thấy card {card_id} qua API: {resp.status_code}")
                except Exception as api_e:
                    print(f"  -> Lỗi khi gọi API cho card {card_id}: {api_e}")
        if not success:
            failed_cards.append(card_id)
        sleep(0.2)

print(f"Tổng số card lấy được: {len(results)}")
print(f"Tổng số card lỗi: {len(failed_cards)}")

with open('d:/Pokemon/backend/script_db/japan_cards_full.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("Đã lưu kết quả ra japan_cards_full.json")

with open('d:/Pokemon/backend/script_db/japan_cards_failed.json', 'w', encoding='utf-8') as f:
    json.dump(failed_cards, f, ensure_ascii=False, indent=2)
print("Đã lưu danh sách card lỗi ra japan_cards_failed.json")