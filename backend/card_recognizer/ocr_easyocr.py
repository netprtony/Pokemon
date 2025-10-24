import cv2
import numpy as np
import easyocr
from ultralytics import YOLO

# Load mô hình YOLOv10 ONNX qua ultralytics
onnx_path = 'D:\\Pokemon\\backend\\card_recognizer\\model\\best.onnx'
model = YOLO(onnx_path, task='detect')
reader = easyocr.Reader(['ja', 'en'])


def preprocess_image(img, target_width=1280, clahe_clip=3.0, denoise_h=10):
    """Tiền xử lý toàn ảnh trước khi detect:
    - resize tỉ lệ theo target_width
    - CLAHE trên kênh L (LAB)
    - denoise màu
    - gamma correction nhẹ
    - unsharp sharpening
    """
    if img is None:
        return img

    h, w = img.shape[:2]
    if w == 0:
        return img

    # Resize (phóng to nếu nhỏ) - giữ tỷ lệ
    if target_width is not None and w != target_width:
        scale = target_width / w
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_LINEAR)

    # CLAHE trên kênh L
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clahe_clip, tileGridSize=(8, 8))
    l2 = clahe.apply(l)
    lab = cv2.merge((l2, a, b))
    img_clahe = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    # Denoise màu
    img_dn = cv2.fastNlMeansDenoisingColored(img_clahe, None, denoise_h, denoise_h, 7, 21)

    # Gamma correction (slight)
    gamma = 1.05
    invGamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** invGamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
    img_gamma = cv2.LUT(img_dn, table)

    # Unsharp mask (sharpen)
    blurred = cv2.GaussianBlur(img_gamma, (0, 0), sigmaX=3)
    img_sharp = cv2.addWeighted(img_gamma, 1.4, blurred, -0.4, 0)

    return img_sharp


def preprocess_roi_for_ocr(roi, target_height=128):
    """Tiền xử lý mỗi ROI trước khi OCR:
    - convert grayscale, CLAHE, denoise, resize tăng kích thước,
    - optional adaptive thresholding
    """
    if roi is None or roi.size == 0:
        return roi

    # Convert to gray and CLAHE
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    # Denoise
    gray = cv2.medianBlur(gray, 3)

    # Resize to improve OCR (maintain aspect ratio)
    h, w = gray.shape[:2]
    if h == 0:
        return gray
    scale = max(1.0, target_height / h)
    new_w = int(w * scale)
    gray = cv2.resize(gray, (new_w, target_height), interpolation=cv2.INTER_CUBIC)

    # Optional binarize if text contrast low
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # combine original and thresholded to keep robustness
    combined = cv2.bitwise_or(gray, th)

    # Convert back to 3-channel since easyocr can accept color images too
    return cv2.cvtColor(combined, cv2.COLOR_GRAY2BGR)


def detect_regions(img, conf_thres=0.5):
    # Use preprocessed image for detection to improve boxes
    img_proc = preprocess_image(img, target_width=1280)
    results = model(img_proc)
    boxes = []
    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            if conf > conf_thres and cls in [0, 1]:
                boxes.append([x1, y1, x2, y2, cls])
    return boxes


def scan_card(img_path):
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError("Không đọc được ảnh.")
    # preprocess for better detection and visualization
    img_proc = preprocess_image(img, target_width=1280)
    boxes = detect_regions(img_proc)
    results = {"name": None, "card_number": None}
    vis = img_proc.copy()

    for box in boxes:
        x1, y1, x2, y2, cls = box
        # clamp
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(vis.shape[1], x2), min(vis.shape[0], y2)
        roi = vis[y1:y2, x1:x2]
        roi_pre = preprocess_roi_for_ocr(roi)
        ocr_result = reader.readtext(roi_pre)
        text = ocr_result[0][1] if ocr_result else ""
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
    # Đọc ảnh từ bytes
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        return {"name": "Lỗi", "card_number": "Lỗi"}

    # preprocess full image before detection
    img_proc = preprocess_image(img, target_width=1280)
    boxes = detect_regions(img_proc)
    results = {"name": None, "card_number": None}

    # Tách boxes theo lớp: 1 = card_number, 0 = name
    num_boxes = [b for b in boxes if b[4] == 1]
    name_boxes = [b for b in boxes if b[4] == 0]

    def ocr_roi(roi):
        try:
            roi_pre = preprocess_roi_for_ocr(roi)
            ocr_res = reader.readtext(roi_pre)
            if not ocr_res:
                return ""
            # chọn kết quả có confidence cao nhất
            best = max(ocr_res, key=lambda r: r[2]) if isinstance(ocr_res, list) else ocr_res[0]
            return best[1] if isinstance(best, (list, tuple)) and len(best) > 1 else str(best)
        except Exception as e:
            print(f"OCR error: {e}")
            return ""

    # Xử lý card_number trước (không tạo lại reader, chỉ gọi lại)
    for x1, y1, x2, y2, cls in num_boxes:
        # clamp bounds
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img_proc.shape[1], x2), min(img_proc.shape[0], y2)
        if x2 <= x1 or y2 <= y1:
            continue
        roi = img_proc[y1:y2, x1:x2]
        text = ocr_roi(roi)
        if text:
            results["card_number"] = text
        cv2.rectangle(img_proc, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(img_proc, 'card_number', (x1, max(12, y1-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

    # Xử lý name sau khi đã xử lý card_number
    for x1, y1, x2, y2, cls in name_boxes:
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img_proc.shape[1], x2), min(img_proc.shape[0], y2)
        if x2 <= x1 or y2 <= y1:
            continue
        roi = img_proc[y1:y2, x1:x2]
        text = ocr_roi(roi)
        if text:
            results["name"] = text
        cv2.rectangle(img_proc, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(img_proc, 'name', (x1, max(12, y1-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

    # Lưu ảnh kết quả giống scan_card
    cv2.imwrite('result.jpg', img_proc)
    return results


if __name__ == "__main__":
    img_path = 'D:/Pokemon/backend/card_recognizer/image_test/z7126598688295_0190f0c86106b57bcd9917b41b1e7b60.jpg'
    result = scan_card(img_path)
    print("Kết quả nhận diện:", result)
