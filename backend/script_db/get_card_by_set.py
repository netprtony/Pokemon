import os
import json
import requests
from collections import defaultdict
from PIL import Image
from io import BytesIO

# Đường dẫn file json
JSON_PATH = 'd:/Pokemon/backend/script_db/pokemon_cards_full.json'

# Các set muốn tải (ví dụ: ['SM1', 'SM2'])
# target_sets = ['xy12', "bw11", "ecard3", "neo1", "base5", "base1", "base2", "base3", "base4", "base5", "base6"]
target_sets = None

# Đường dẫn thư mục lưu ảnh
OUTPUT_DIR = 'D:\\Pokemon\\backend\\script_db\\temp_card'

# Tỉ lệ scale (ví dụ: 0.5 là giảm còn 50%)
scale_ratio = 0.5

# Nếu muốn scale theo kích thước cố định, đặt fixed_size = (width, height), ví dụ (384, 512)
fixed_size = (734, 1024)  # Đặt None nếu không muốn dùng

# Danh sách supertype muốn tải (ví dụ: ['Trainer', 'Energy']); đặt None để lấy tất cả
include_supertypes = ['Trainer', 'Energy']  # Thêm tên supertype vào đây nếu chỉ muốn tải một số loại

def safe_folder_name(value, fallback):
    name = (value or fallback).strip()
    sanitized = name.replace('/', '_').replace('\\', '_')
    return sanitized or fallback

def get_image_extension(url, response, default='.png'):
    # Lấy từ URL
    ext = os.path.splitext(url)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png', '.webp']:
        return ext
    # Lấy từ header
    content_type = response.headers.get('Content-Type', '')
    if 'jpeg' in content_type:
        return '.jpg'
    if 'png' in content_type:
        return '.png'
    if 'webp' in content_type:
        return '.webp'
    return default

# Tùy chọn đuôi mở rộng, ví dụ: '.jpg', '.png', None để tự động
image_extension = '.jpg'  # Luôn lưu ảnh với đuôi .jpg

def main():
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        cards = json.load(f)

    # Gom thẻ theo set_id
    sets = defaultdict(list)
    for card in cards:
        set_id = card.get('set_id') or 'unknown_set'
        supertype = card.get('supertype', '')
        if include_supertypes and supertype not in include_supertypes:
            continue
        if target_sets is None or set_id in target_sets:
            if card.get('reference_image_url') and card.get('master_card_id'):
                sets[set_id].append(card)

    for set_id, card_list in sets.items():
        set_folder = safe_folder_name(set_id, 'unknown_set')
        print(f"Đang xử lý folder: {set_id} ({len(card_list)} thẻ)")

        for card in card_list:
            image_url = card['reference_image_url']
            master_card_id = card['master_card_id'].replace('/', '_')
            supertype_folder = safe_folder_name(card.get('supertype'), 'Unknown')

            folder_path = os.path.join(OUTPUT_DIR, set_folder, supertype_folder)
            os.makedirs(folder_path, exist_ok=True)

            try:
                resp = requests.get(image_url, timeout=10)
                resp.raise_for_status()
                # Xác định đuôi mở rộng
                ext = image_extension if image_extension else get_image_extension(image_url, resp)
                save_path = os.path.join(folder_path, f"{master_card_id}{ext}")

                if os.path.exists(save_path):
                    print(f"Đã tồn tại: {save_path}")
                    continue

                img = Image.open(BytesIO(resp.content))
                # Scale theo fixed_size nếu có, ngược lại dùng scale_ratio
                if fixed_size:
                    img = img.resize(fixed_size, Image.LANCZOS)
                elif scale_ratio != 1.0:
                    new_size = (int(img.width * scale_ratio), int(img.height * scale_ratio))
                    img = img.resize(new_size, Image.LANCZOS)
                # Nếu lưu JPEG thì chuyển sang RGB
                if ext in ['.jpg', '.jpeg']:
                    img = img.convert('RGB')
                img.save(save_path)
                print(f"Đã tải: {save_path}")
            except Exception as e:
                print(f"Lỗi tải {image_url}: {e}")

if __name__ == '__main__':
    main()