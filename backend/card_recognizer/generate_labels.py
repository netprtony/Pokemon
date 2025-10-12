import json
import os
import random
import requests
import shutil
from typing import Dict, List
from tqdm import tqdm
from io import BytesIO
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
SCOPES = ['https://www.googleapis.com/auth/drive.file']

DATA_ROOT = r'D:\Pokemon\backend\script_db\temp_card'
JSON_PATH = r'D:\Pokemon\backend\script_db\pokemon_cards_full.json'
TEMPLATES_PATH = r'D:\Pokemon\backend\card_recognizer\layout_templates.json'
OUTPUT_DIR = r'D:\Pokemon\backend\card_recognizer\pokemon_dataset'
TRAIN_RATIO = 0.8
VALID_EXTS = {'.png', '.jpg', '.jpeg', '.webp'}

def get_drive_service():
    creds = None
    token_path = 'token.json'

    # Nếu đã đăng nhập trước đó
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    # Nếu chưa đăng nhập, mở trình duyệt để xác thực
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('D:\\Pokemon\\backend\\card_recognizer\\credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    return build('drive', 'v3', credentials=creds)

def download_image(url, save_path):
    if not os.path.exists(save_path):
        try:
            response = requests.get(url)
            response.raise_for_status()
            with open(save_path, 'wb') as f:
                f.write(response.content)
        except requests.exceptions.RequestException as e:
            print(f"Không thể tải ảnh {url}: {e}")
            return False
    return True

def build_drive_service(credentials_path):
    credentials = Credentials.from_service_account_file(
        credentials_path,
        scopes=['https://www.googleapis.com/auth/drive']
    )
    return build('drive', 'v3', credentials=credentials)

def upload_image_to_drive(service, folder_id, file_name, content_bytes):
    media = MediaIoBaseUpload(
        BytesIO(content_bytes),
        mimetype='image/png',
        resumable=False
    )
    file_metadata = {
        'name': file_name,
        'parents': [folder_id]
    }
    service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()

def download_and_store_image(url, file_name, drive_service, drive_folder_id):
    try:
        response = requests.get(url)
        response.raise_for_status()
        upload_image_to_drive(drive_service, drive_folder_id, file_name, response.content)
    except requests.exceptions.RequestException as e:
        print(f"Không thể tải ảnh {url}: {e}")
        return False
    return True

def is_image_exists_on_drive(service, folder_id, file_name):
    query = f"'{folder_id}' in parents and name = '{file_name}' and trashed = false"
    results = service.files().list(q=query, fields="files(id)").execute()
    return len(results.get('files', [])) > 0

def sanitize_card_id(card_id: str) -> str:
    return card_id.replace('/', '_').replace('\\', '_')


def load_card_metadata(json_path: str) -> Dict[str, Dict]:
    with open(json_path, 'r', encoding='utf-8') as f:
        cards = json.load(f)

    lookup: Dict[str, Dict] = {}
    for card in cards:
        master_id = card.get('master_card_id')
        if not master_id:
            continue
        lookup[sanitize_card_id(master_id)] = card
    return lookup


def load_templates(path: str) -> Dict[str, Dict[str, List[int]]]:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def to_points(coords: List[int]) -> List[List[int]]:
    x, y, w, h = coords
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]


def collect_records() -> List[Dict]:
    metadata = load_card_metadata(JSON_PATH)
    templates = load_templates(TEMPLATES_PATH)
    records: List[Dict] = []

    for set_id in sorted(os.listdir(DATA_ROOT)):
        set_dir = os.path.join(DATA_ROOT, set_id)
        if not os.path.isdir(set_dir):
            continue
        if set_id not in templates:
            print(f"Bỏ qua set {set_id}: thiếu template.")
            continue

        for file_name in os.listdir(set_dir):
            ext = os.path.splitext(file_name)[1].lower()
            if ext not in VALID_EXTS:
                continue

            sanitized = os.path.splitext(file_name)[0]
            card_info = metadata.get(sanitized)
            if not card_info:
                print(f"Bỏ qua {file_name}: không tìm thấy metadata.")
                continue

            name_text = card_info.get('name_en')
            number_text = card_info.get('card_number')
            if not name_text or not number_text:
                print(f"Bỏ qua {file_name}: thiếu name hoặc card_number.")
                continue

            template = templates[set_id]
            labels = [
                {"transcription": name_text, "points": to_points(template['name'])},
                {"transcription": number_text, "points": to_points(template['card_number'])}
            ]

            records.append({
                "set_id": set_id,
                "src_path": os.path.join(set_dir, file_name),
                "file_name": file_name,
                "labels": labels
            })

    return records


def write_split(split_records: List[Dict], split_name: str):
    images_dir = os.path.join(OUTPUT_DIR, split_name, 'images')
    os.makedirs(images_dir, exist_ok=True)
    gt_path = os.path.join(OUTPUT_DIR, split_name, 'gt.txt')

    with open(gt_path, 'w', encoding='utf-8') as gt_file:
        for rec in tqdm(split_records, desc=f"Đang sao chép {split_name}"):
            dest_name = f"{rec['set_id']}_{rec['file_name']}"
            dest_path = os.path.join(images_dir, dest_name)
            shutil.copy2(rec['src_path'], dest_path)
            rel_path = f"images/{dest_name}"
            gt_file.write(f"{rel_path}\t{json.dumps(rec['labels'], ensure_ascii=False)}\n")


def generate_dataset():
    records = collect_records()
    if not records:
        print("Không có dữ liệu hợp lệ để tạo dataset.")
        return

    random.seed(42)
    random.shuffle(records)
    split_idx = int(len(records) * TRAIN_RATIO)
    train_records = records[:split_idx]
    val_records = records[split_idx:]

    print(f"Tổng số ảnh: {len(records)} | Train: {len(train_records)} | Val: {len(val_records)}")

    write_split(train_records, 'train_data')
    write_split(val_records, 'val_data')

    print(f"Dataset đã được tạo tại: {OUTPUT_DIR}")


# --- Chạy script ---
if __name__ == '__main__':
    drive_service = get_drive_service()
    generate_dataset()