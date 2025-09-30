import json
import glob
import os

# Load set_id -> printed_total mapping
with open("backend/script_db/pokemon_sets_db.json", encoding="utf-8") as f:
    sets = json.load(f)
set_printed_total = {s["set_id"]: int(s["printed_total"]) for s in sets if s.get("printed_total")}

# Sửa card_number cho từng file
files = glob.glob("backend/script_db/pokemon_cards_master_page_*.json")
for file in files:
    with open(file, encoding="utf-8") as f:
        cards = json.load(f)
    changed = False
    for card in cards:
        set_id = card.get("set_id")
        if not set_id or "card_number" not in card:
            continue
        printed_total = set_printed_total.get(set_id)
        if not printed_total:
            continue
        # Sửa card_number: giữ số trước "/", thay số sau "/" bằng printed_total
        parts = str(card["card_number"]).split("/")
        if len(parts) == 2 and parts[1] != str(printed_total):
            card["card_number"] = f"{parts[0]}/{printed_total}"
            changed = True
    if changed:
        with open(file, "w", encoding="utf-8") as f:
            json.dump(cards, f, ensure_ascii=False, indent=2)
        print(f"Đã sửa {file}")
    else:
        print(f"Không cần sửa {file}")