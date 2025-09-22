import json
from sqlalchemy import text
import database

session = next(database.get_db())

def import_sets(json_path):
    with open(json_path, encoding='utf-8') as f:
        sets = json.load(f)
    for s in sets:
        # Chuyển đổi release_date từ "DD/MM/YYYY" sang "DD-MM-YYYY"
        release_date = s.get("release_date")
        if release_date and "/" in release_date:
            day, month, year = release_date.split("/")
            release_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        session.execute(text("""
            INSERT IGNORE INTO pokemon_sets (
            set_id, set_name_en, set_name_original, series, release_date,
            printed_total, total, ptcgo_code, image_symbol, updated_at
            ) VALUES (
            :set_id, :set_name_en, :set_name_original, :series, :release_date,
            :printed_total, :total, :ptcgo_code, :image_symbol, :updated_at
            )
        """), {
            "set_id": s.get("set_id"),
            "set_name_en": s.get("set_name_en"),
            "set_name_original": s.get("set_name_original"),
            "series": s.get("series"),
            "release_date": release_date,  # ISO format: 'YYYY-MM-DD'
            "printed_total": int(s.get("printed_total")) if s.get("printed_total") else None,
            "total": int(s.get("total")) if s.get("total") else None,
            "ptcgo_code": s.get("ptcgo_code"),
            "image_symbol": s.get("image_symbol"),
            "updated_at": s.get("updated_at")  # ISO format: 'YYYY-MM-DD HH:MM:SS'
        })
    session.commit()
    print(f"Đã import {len(sets)} sets.")

def import_cards(json_path):
    with open(json_path, encoding='utf-8') as f:
        cards = json.load(f)
    for c in cards:
        # Chuyển đổi updated_at từ "HH:MM DD/MM/YYYY" sang "YYYY-MM-DD HH:MM:SS"
        updated_at = c.get("updated_at")
        if updated_at and " " in updated_at and "/" in updated_at:
            time_part, date_part = updated_at.split(" ")
            day, month, year = date_part.split("/")
            updated_at = f"{year}-{month.zfill(2)}-{day.zfill(2)} {time_part}:00"
        session.execute(text("""
            INSERT IGNORE INTO pokemon_cards_master (
            master_card_id, set_id, card_number, name_en, name_original,
            version_en, version_original, supertype, subtypes, rarity,
            illustrator, reference_image_url, flavorText, updated_at
            ) VALUES (
            :master_card_id, :set_id, :card_number, :name_en, :name_original,
            :version_en, :version_original, :supertype, :subtypes, :rarity,
            :illustrator, :reference_image_url, :flavorText, :updated_at
            )
        """), {
            "master_card_id": c.get("master_card_id"),
            "set_id": c.get("set_id"),
            "card_number": c.get("card_number"),
            "name_en": c.get("name_en"),
            "name_original": c.get("name_original"),
            "version_en": c.get("version_en"),
            "version_original": c.get("version_original"),
            "supertype": c.get("supertype"),
            "subtypes": c.get("subtypes"),
            "rarity": c.get("rarity"),
            "illustrator": c.get("illustrator"),
            "reference_image_url": c.get("reference_image_url"),
            "flavorText": c.get("flavorText"),
            "updated_at": updated_at  # ISO format: 'YYYY-MM-DD HH:MM:SS'
        })
    session.commit()
    print(f"Đã import {len(cards)} cards.")

if __name__ == "__main__":
    import_sets("backend/script_db/pokemon_sets_db.json")
    import_cards("backend/script_db/pokemon_cards_master_page_1.json")
    session.close()