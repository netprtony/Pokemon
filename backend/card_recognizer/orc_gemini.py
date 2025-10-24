from openai import OpenAI
import json
import base64
import requests
import os
import cv2
import numpy as np

from ultralytics import YOLO

# CONFIG - tìm file config trong cùng thư mục script, fallback nếu tên file lạ "config,json"
script_dir = os.path.dirname(__file__)
config_file = os.path.join(script_dir, 'config.json')
fallback_config = os.path.join(script_dir, 'config,json')

api_key = "AIzaSyD5Y2GlsSHC9HM8iwURVTp4X9Ne2ZKiih4"
model_name = "gemini-2.5-flash"
base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"


# Hàm đọc config về các trường cần trích xuất
def read_config(file_path):
    # thử file chính, nếu không tồn tại thử fallback, nếu vẫn không có thì thông báo rõ
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        if os.path.exists(fallback_config):
            with open(fallback_config, 'r', encoding='utf-8') as file:
                return json.load(file)
        raise FileNotFoundError(f"Config file not found. Tried: {file_path} and {fallback_config}")


# Hàm chuyển image thành base64
def encode_image(image_path_or_url):
    """Accept either an http(s) URL or a local file path (with or without file://) and return base64 string."""
    # handle file:// prefix
    if isinstance(image_path_or_url, str) and image_path_or_url.startswith("file://"):
        image_path_or_url = image_path_or_url[7:]

    # URL case
    if isinstance(image_path_or_url, str) and image_path_or_url.lower().startswith(("http://", "https://")):
        resp = requests.get(image_path_or_url, stream=True)
        resp.raise_for_status()
        data = resp.content
    else:
        # local file case
        if not os.path.exists(image_path_or_url):
            raise FileNotFoundError(f"Image not found: {image_path_or_url}")
        with open(image_path_or_url, "rb") as fh:
            data = fh.read()

    return base64.b64encode(data).decode("utf-8")

onnx_path = 'D:\\Pokemon\\backend\\card_recognizer\\model\\best.onnx'
model_yolo = YOLO(onnx_path, task='detect')

def detect_regions(img, conf_thres=0.5):
    # Dự đoán với ultralytics YOLO
    results = model_yolo(img)
    boxes = []
    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            if conf > conf_thres and cls in [0, 1]:
                boxes.append([x1, y1, x2, y2, cls])
    # vẽ và lưu ảnh đã chú thích để gỡ lỗi
    for box in boxes:
        x1, y1, x2, y2, cls = box
        label = 'name' if cls == 0 else 'card_number'
        cv2.rectangle(img, (x1, y1), (x2, y2), (0,255,0), 2)
        cv2.putText(img, label, (x1, max(12, y1-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)
    cv2.imwrite(os.path.join(script_dir, 'result.jpg'), img)
    
    return boxes

def crop_and_b64(img, box):
    x1, y1, x2, y2, cls = box
    h, w = img.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    if x2 <= x1 or y2 <= y1:
        return None
    crop = img[y1:y2, x1:x2]
    ok, buf = cv2.imencode('.jpg', crop, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    if not ok:
        return None
    b64 = base64.b64encode(buf.tobytes()).decode('utf-8')
    return f"data:image/jpeg;base64,{b64}"

# --- pipeline: detect -> crop two ROIs (card_number first, then name) -> send two base64 images to model
image_path = os.path.join(script_dir, 'image_test', '204_hires.png')
image_original = cv2.imread(image_path)
if image_original is None:
    raise ValueError(f"Cannot read image: {image_path}")

boxes = detect_regions(image_original)

# find card_number (cls==1) first, then name (cls==0)
card_number_box = next((b for b in boxes if b[4] == 1), None)
name_box = next((b for b in boxes if b[4] == 0), None)

images_payload = []
# append card_number image first if found
if card_number_box:
    datauri = crop_and_b64(image_original, card_number_box)
    if datauri:
        images_payload.append({
            "type": "image_url",
            "image_url": {"url": datauri},
        })
# append name image
if name_box:
    datauri = crop_and_b64(image_original, name_box)
    if datauri:
        images_payload.append({
            "type": "image_url",
            "image_url": {"url": datauri},
        })

config_json = read_config(config_file)
ocr_prompt = (
    "Bạn là một OCR post-processor. Trích xuất các dữ liệu trong ảnh. "
    "Trả về duy nhất một JSON theo mẫu:\n" + json.dumps(config_json, ensure_ascii=False) +
    "\nƯu tiên xử lý image thứ nhất là card_number, image thứ hai là name. Nếu không đọc được trường thì trả null. "
    "Chỉ trả về JSON."
)

# build messages: one text block then the image blocks (images in order)
message_content = [
    {"type": "text", "text": ocr_prompt}
] + images_payload

client = OpenAI(api_key=api_key, base_url=base_url)
response = client.chat.completions.create(
    model=model_name,
    messages=[{
        "role": "user",
        "content": message_content
    }],
    temperature=0.0,
    top_p=0.8,
    max_tokens=256
)

# print model raw content
print(response.choices[0].message.content)