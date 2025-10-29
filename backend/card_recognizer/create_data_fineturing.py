import json
import os
import glob
import csv
with open('d:/Pokemon/backend/script_db/pokemon_cards_full.json', encoding='utf-8') as f:
    card_data = json.load(f)

# Tạo dict tra cứu nhanh theo master_card_id
card_lookup = {}
for card in card_data:
    if 'master_card_id' in card:
        card_lookup[card['master_card_id']] = card

IMG_DIR = 'd:/Pokemon/backend/card_recognizer/datasets/val_data/images'
OUT_DIR = 'd:/Pokemon/backend/card_recognizer/datasets/val_data/ground_truth'

os.makedirs(OUT_DIR, exist_ok=True)

img_files = glob.glob(os.path.join(IMG_DIR, '*.jpg')) + glob.glob(os.path.join(IMG_DIR, '*.png'))

for img_path in img_files:
    fname = os.path.splitext(os.path.basename(img_path))[0]  # master_card_id
    card = card_lookup.get(fname)
    if not card:
        print(f"Không tìm thấy {fname} trong pokemon_cards_full.json")
        continue

    gt = {
        "gt_parse": {
            "card_details": [
                {"name_en": card.get("name_en", "")},
                {"card_number": card.get("card_number", "")}
            ]
        }
    }
    out_path = os.path.join(OUT_DIR, f"{fname}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(gt, f, ensure_ascii=False, indent=2)
    

manifest_path = os.path.join(OUT_DIR, "manifest.csv")
with open(manifest_path, "w", newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["image_path", "ground_truth_path"])
    for img_path in img_files:
        fname = os.path.splitext(os.path.basename(img_path))[0]
        gt_path = os.path.join(OUT_DIR, f"{fname}.json")
        if os.path.exists(gt_path):
            writer.writerow([os.path.relpath(img_path, OUT_DIR), f"{fname}.json"])