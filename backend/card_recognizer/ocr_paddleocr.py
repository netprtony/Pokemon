import cv2
import numpy as np
from ultralytics import YOLO
from paddleocr import PaddleOCR

# Load mô hình YOLOv10 ONNX qua ultralytics
onnx_path = 'D:\\Pokemon\\backend\\card_recognizer\\model\\best.onnx'
model = YOLO(onnx_path, task='detect')

# PaddleOCR cho cả tiếng Nhật và tiếng Anh
ocr_en = PaddleOCR(lang='en', use_angle_cls=True)
ocr_jp = PaddleOCR(lang='japan', use_angle_cls=True)


def preprocess_roi_for_ocr(roi, target_height=128):
    """Tiền xử lý mỗi ROI trước khi OCR."""
    if roi is None or roi.size == 0:
        return roi
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    gray = cv2.medianBlur(gray, 3)
    h, w = gray.shape[:2]
    if h == 0:
        return gray
    scale = max(1.0, target_height / h)
    new_w = int(w * scale)
    gray = cv2.resize(gray, (new_w, target_height), interpolation=cv2.INTER_CUBIC)
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    combined = cv2.bitwise_or(gray, th)
    return cv2.cvtColor(combined, cv2.COLOR_GRAY2BGR)


def detect_regions(img, conf_thres=0.5):
    results = model(img)
    boxes = []
    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            if conf > conf_thres and cls in [0, 1]:
                boxes.append([x1, y1, x2, y2, cls])
    return boxes


def recognize_text_paddle(roi):
    roi_pre = preprocess_roi_for_ocr(roi)
    # Dùng cả tiếng Anh và Nhật, chọn kết quả có confidence cao nhất
    result_en = ocr_en.predict(roi_pre)
    result_jp = ocr_jp.predict(roi_pre)
    text_en, conf_en = '', 0
    text_jp, conf_jp = '', 0
    if result_en and isinstance(result_en[0], dict):
        texts = result_en[0].get('rec_texts', [])
        scores = result_en[0].get('rec_scores', [])
        if texts:
            text_en = texts[0]
            conf_en = scores[0] if scores else 0
    if result_jp and isinstance(result_jp[0], dict):
        texts = result_jp[0].get('rec_texts', [])
        scores = result_jp[0].get('rec_scores', [])
        if texts:
            text_jp = texts[0]
            conf_jp = scores[0] if scores else 0
    return text_en if conf_en >= conf_jp else text_jp


def scan_card(img_path):
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError("Không đọc được ảnh.")
    boxes = detect_regions(img)
    print("YOLO detect boxes:", boxes)  # <--- Thêm dòng này
    results = {"name": None, "card_number": None}
    vis = img.copy()
    for box in boxes:
        x1, y1, x2, y2, cls = box
        print(f"Box: {box}")  # <--- Thêm dòng này
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(vis.shape[1], x2), min(vis.shape[0], y2)
        roi = vis[y1:y2, x1:x2]
        if cls == 0:
            cv2.imwrite(f"debug_name_{x1}_{y1}.jpg", roi)  # <--- Thêm dòng này
        text = recognize_text_paddle(roi)
        if cls == 0:
            results["name"] = text
        elif cls == 1:
            results["card_number"] = text
        label = 'name' if cls == 0 else 'card_number'
        cv2.rectangle(vis, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(vis, label, (x1, max(12, y1-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)
    cv2.imwrite('result.jpg', vis)
    return results


def process_pokemon_card(image_bytes):
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        return {"name": "Lỗi", "card_number": "Lỗi"}
    boxes = detect_regions(img)
    results = {"name": None, "card_number": None}
    num_boxes = [b for b in boxes if b[4] == 1]
    name_boxes = [b for b in boxes if b[4] == 0]
    for x1, y1, x2, y2, cls in num_boxes:
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img.shape[1], x2), min(img.shape[0], y2)
        if x2 <= x1 or y2 <= y1:
            continue
        roi = img[y1:y2, x1:x2]
        text = recognize_text_paddle(roi)
        if text:
            results["card_number"] = text
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(img, 'card_number', (x1, max(12, y1-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)
    for x1, y1, x2, y2, cls in name_boxes:
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img.shape[1], x2), min(img.shape[0], y2)
        if x2 <= x1 or y2 <= y1:
            continue
        roi = img[y1:y2, x1:x2]
        text = recognize_text_paddle(roi)
        if text:
            results["name"] = text
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(img, 'name', (x1, max(12, y1-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)
    cv2.imwrite('result.jpg', img)
    return results


if __name__ == "__main__":
    img_path = 'D:/Pokemon/backend/card_recognizer/image_test/z7126598911642_67cc2ae3c89937f48a907384fa975561 - Copy.jpg'
    image_bytes = open(img_path, 'rb').read()
    result = process_pokemon_card(image_bytes)
    print("Kết quả nhận diện:", result)
