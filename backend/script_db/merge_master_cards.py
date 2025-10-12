import json
import glob
from pathlib import Path

BASE_DIR = Path(__file__).parent
OUTPUT = BASE_DIR / "pokemon_cards_full.json"

def merge_master_pages():
    pages = sorted(glob.glob(str(BASE_DIR / "card_master_data" / "pokemon_cards_master_page_*.json")))
    merged = []
    for page_path in pages:
        with open(page_path, "r", encoding="utf-8") as f:
            merged.extend(json.load(f))
    with open(OUTPUT, "w", encoding="utf-8") as out:
        json.dump(merged, out, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    merge_master_pages()
    print(f"Merged {len(glob.glob(str(BASE_DIR / 'card_master_data' / 'pokemon_cards_master_page_*.json')))} files into {OUTPUT}")