import asyncio
import json
from tcgdexsdk import TCGdex, Language
from tcgdexsdk.enums import Extension, Quality

async def fetch_card_info(card_ids, lang="ja"):
    sdk = TCGdex(lang)
    results = []
    for cid in card_ids:
        try:
            card = await sdk.card.get(cid)
            if card:
                # Convert card object to dict (may need to adjust fields)
                info = card.__dict__.copy()
                # Optionally, get image url
                info["image_url"] = card.get_image_url(Quality.HIGH, Extension.PNG)
                results.append(info)
        except Exception as e:
            print(f"Error fetching {cid}: {e}")
    return results

def extract_ids_from_json(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    ids = []
    for entry in data:
        if "image" in entry:
            # Parse id from url, e.g. .../S12a/001 -> S12a-001
            parts = entry["image"].split("/")
            if len(parts) >= 5:
                set_id = parts[-2]
                card_num = parts[-1]
                ids.append(f"{set_id}-{card_num}")
    return ids

async def main():
    json_path = "d:/Pokemon/backend/script_db/japan_pokemon_card.json"
    output_path = "d:/Pokemon/backend/script_db/japan_pokemon_card_full.json"
    card_ids = extract_ids_from_json(json_path)
    print(f"Found {len(card_ids)} card ids.")
    card_infos = await fetch_card_info(card_ids)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(card_infos, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(card_infos)} card infos to {output_path}")

if __name__ == "__main__":
    asyncio.run(main())