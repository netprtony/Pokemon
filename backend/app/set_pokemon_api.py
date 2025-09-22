from pokemontcgsdk import RestClient, Set
from requests.exceptions import RequestException
from dotenv import load_dotenv
import os
from datetime import datetime
import time
import json

load_dotenv()
POKEMONTCG_IO_API_KEY = os.getenv("POKEMONTCG_IO_API_KEY")
RestClient.configure(POKEMONTCG_IO_API_KEY)

def fetch_and_save_sets():
    retries = 3
    delay = 5

    try:
        sets = Set.all()
        print(f"Đã lấy {len(sets)} bộ sưu tập")

        export_sets = []
        for s in sets:
            set_id = s.id
            set_name_en = s.name
            set_name_original = None  # API không cung cấp
            series = s.series
            release_date = None
            if getattr(s, 'releaseDate', None):
                try:
                    release_date = datetime.strptime(s.releaseDate, '%Y/%m/%d').strftime('%d/%m/%Y')
                except Exception:
                    release_date = None
            printed_total = getattr(s, 'printedTotal', None)
            total = getattr(s, 'total', None)
            ptcgo_code = getattr(s, 'ptcgoCode', None)
            image_symbol = s.images.symbol if getattr(s.images, 'symbol', None) else None
            updated_at = None
            if getattr(s, 'updatedAt', None):
                try:
                    updated_at = datetime.strptime(s.updatedAt, '%Y/%m/%d %H:%M:%S').isoformat(sep=' ')
                except Exception:
                    updated_at = None

            export_sets.append({
                "set_id": set_id,
                "set_name_en": set_name_en,
                "set_name_original": set_name_original,
                "series": series,
                "release_date": release_date,
                "printed_total": printed_total,
                "total": total,
                "ptcgo_code": ptcgo_code,
                "image_symbol": image_symbol,
                "updated_at": updated_at
            })

        # Xuất file JSON
        out_path = "backend/script_db/pokemon_sets_db.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(export_sets, f, ensure_ascii=False, indent=2)

        print(f"Đã xuất {len(export_sets)} bộ sưu tập ra {out_path}")

    except RequestException as e:
        print(f"Lỗi khi lấy dữ liệu sets: {e}")
        if "504" in str(e):
            print("Gặp lỗi 504 Gateway Timeout, thử lại sau vài giây...")
            if retries > 0:
                time.sleep(delay)
                retries -= 1
                fetch_and_save_sets()
            else:
                print("Hết số lần thử, dừng lại")
        else:
            raise e
    except Exception as e:
        print(f"Lỗi không xác định: {e}")

if __name__ == "__main__":
    fetch_and_save_sets()