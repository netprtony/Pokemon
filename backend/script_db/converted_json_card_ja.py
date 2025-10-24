import json

def convert_card(card, idx):
    # Chuyển đổi từng trường theo mapping
    return {
        "master_card_id": card.get("id", idx),
        "set_id": card.get("set", {}).get("id", None),
        "card_number": f'{card.get("localId", "")}/{card.get("set", {}).get("cardCount", {}).get("total", "")}',
        "name_en": card.get("name", None),
        "supertype": card.get("category", None),
        
        "subtypes": card.get("stage", None) or "",  # subtypes là dạng string
        "rarity": card.get("rarity", None),
        "illustrator": card.get("illustrator", None),
        "reference_image_url": card.get("reference_image_url", None),
        "flavorText": card.get("description", None),
        "updated_at": card.get("updated", None)
    }

def main():
    # Đọc dữ liệu gốc
    with open('backend/script_db/japan_cards_full.json', 'r', encoding='utf-8') as f:
        cards = json.load(f)

    # Chuyển đổi dữ liệu
    converted_cards = [convert_card(card, idx) for idx, card in enumerate(cards)]

    # Ghi ra file mới
    with open('backend/script_db/japan_cards_full_converted.json', 'w', encoding='utf-8') as f:
        json.dump(converted_cards, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()