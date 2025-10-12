import cv2
import numpy as np
import easyocr
from typing import Dict
import os
# Khởi tạo EasyOCR reader một lần để tái sử dụng
reader = easyocr.Reader(['en']) 
name_template_path = os.path.join(os.path.dirname(__file__), "templates", "name_template.png")
number_template_path = os.path.join(os.path.dirname(__file__), "templates", "number_template.png")

def read_image_from_bytes(image_bytes: bytes) -> np.ndarray:
    """Đọc ảnh từ bytes và chuyển thành định dạng OpenCV."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def extract_roi_by_template(image: np.ndarray, template_path: str) -> np.ndarray:
    template = cv2.imread(template_path, 0)
    if template is None:
        raise FileNotFoundError(f"Không tìm thấy ảnh mẫu tại: {template_path}")
    
    w, h = template.shape[::-1]
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    res = cv2.matchTemplate(gray_image, template, cv2.TM_CCOEFF_NORMED)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
    top_left = max_loc
    bottom_right = (top_left[0] + w, top_left[1] + h)
    roi = image[top_left[1]:bottom_right[1], top_left[0]:bottom_right[0]]
    return roi

def process_pokemon_card(image_bytes: bytes) -> Dict[str, str]:
    """
    Quy trình xử lý hoàn chỉnh: nhận ảnh, trích xuất ROI, và nhận dạng văn bản.
    """
    main_image = read_image_from_bytes(image_bytes)

    try:
        # 1. Trích xuất ROI cho tên thẻ và số thẻ
        name_roi = extract_roi_by_template(main_image, name_template_path)
        number_roi = extract_roi_by_template(main_image, number_template_path)

        # 2. Sử dụng EasyOCR để đọc văn bản từ mỗi ROI
        name_results = reader.readtext(name_roi)
        number_results = reader.readtext(number_roi)

        # 3. Trích xuất văn bản sạch từ kết quả
        card_name = name_results[0][1] if name_results else "Không nhận dạng được"
        card_number = number_results[0][1] if number_results else "Không nhận dạng được"
        
        return {"name": card_name, "card_number": card_number}

    except Exception as e:
        print(f"Lỗi trong quá trình xử lý OCR: {e}")
        return {"name": "Lỗi", "card_number": "Lỗi"}
