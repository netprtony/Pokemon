import json
from collections import Counter

def analyze_pokemon_sets(json_file_path):
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Đếm số lượng thẻ trong mỗi set_id
    set_counts = Counter(card['set_id'] for card in data)

    print(f"Tìm thấy tổng cộng {len(data)} thẻ trong {len(set_counts)} bộ khác nhau.\n")
    print("Thống kê số lượng thẻ theo từng bộ (top 30):")

    # In ra 100 bộ phổ biến nhất
    for set_id, count in set_counts.items():
        print(f"- {set_id}: {count} thẻ")

    return set_counts

# Thay 'your_data.json' bằng đường dẫn đến file dữ liệu của bạn
analyze_pokemon_sets('backend/script_db/pokemon_cards_full.json')